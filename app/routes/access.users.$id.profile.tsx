import { useRef, useState } from 'react';
import { ActionArgs, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import { getSession, storage } from '~/utility/flash.server';
import { mapProfileToUser } from '~/auth/auth.server';
import { getTokenizedUser, type User } from '~/models/users.server';
import { listServiceCentresForKeys, type ServiceCentre } from '~/models/service-centres.server';

// import { listLegalEntitiesForKeys, type LegalEntity } from '~/models/legal-entities.server';
// import { listClientsForKeys, type Client } from '~/models/clients.server';
// import { listProvidersForKeys, type Provider } from '~/models/providers.server';

import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import { SelectorModal, RefSelectorModal, entities } from '~/components/manage/selector';
import Alert, { Level } from '~/components/alert';

import { Breadcrumb } from "~/layout/breadcrumbs";
import ButtonGroup, { type ButtonGroupButton } from '~/components/button-group';

export const handle = {
  breadcrumb: ({ user, current }: { user: User, current: boolean }) =>
    <Breadcrumb key={user.id} to={`/access/users/${user.id}/profile`} name="profile" current={current} />
};

type Authorizable = ServiceCentre;
type AuthorizableWithType = Authorizable & { type: string, Icon?: any };

const toAuthorizables = (type: string, authorizables: Array<Authorizable>) => {
  return authorizables.map(a => ({ ...a, type, Icon: entities.get(type).Icon }));
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const profile = await getTokenizedUser({ id });
  if (profile === undefined) return notFound();
  const user = mapProfileToUser(id, profile);

  const serviceCentres = await listServiceCentresForKeys({ keys: user?.keys.serviceCentre });
  // const clients = await listClientsForKeys({ keys: user?.keys.client });
  // const legalEntities = await listLegalEntitiesForKeys({ keys: user?.keys.legalEntity });
  // const providers = await listProvidersForKeys({ keys: user?.keys.provider });

  return { user, authorizables: [
    ...toAuthorizables('service-centre', serviceCentres),
    // ...toAuthorizables('client', clients),
    // ...toAuthorizables('legal-entity', legalEntities),
    // ...toAuthorizables('provider', providers),
  ]};
};

export async function action({ request }: ActionArgs) {
  let message;
  const { intent, key, entity } = await request.json();

  if (intent === 'revoke-authorization') {
    message = `Authorization Revoked:Authorization was revoked for ${entity.type} ${entity.name}.`;
  }

  if (intent === 'grant-authorization') {
    message = `Authorization Granted:Authorization was granted for ${entity.type} ${entity.name}.`;
  }

  const session = await getSession(request);
  session.flash("flash:text", message);
  session.flash("flash:level", Level.Success);

  return redirect("/", {
    headers: { "Set-Cookie": await storage.commitSession(session) },
    status: 200,
  });
};

export default function Profile() {
  const { t } = useTranslation();
  const { user, authorizables } = useLoaderData();
  const modal = useRef<RefSelectorModal>(null);
  const submit = useSubmit();
  const [ entity, setEntity ] = useState<AuthorizableWithType>();

  const confirm = useRef<RefConfirmModal>(null);

  const handleRevoke = (entity: AuthorizableWithType) => {
    setEntity(entity);
    confirm.current?.show(
      "Revoke this Authorization?", 
      "Yes, Revoke", "Cancel", 
      `Are you sure you want to remoke authorization for ${t(entity.type)} ${entity.name}?`);
  };

  const onConfirmRevoke = () => {
    if (entity === undefined) return;
    submit({ intent: "revoke-authorization", 
             key: [ entity.keyStart, entity.keyEnd ], 
             entity: { name: entity.name, type: t(entity.type) }}, 
      { method: "post", encType: "application/json" });
  };

  const handleGrant = (type: string, entity: AuthorizableWithType) => {
    submit({ intent: "grant-authorization", 
             key: [ entity.keyStart, entity.keyEnd ], 
             entity: { name: entity.name, type: t(type) }}, 
      { method: "post", encType: "application/json" });
  };

  const showModal = (entity: string) => modal.current?.show(entity);

  const authorizationActions: Array<ButtonGroupButton> = Array.from(entities.keys()).map(key => (
    { name: key, onClick: () => showModal(key), Icon: entities.get(key).Icon }
  ));

  return (
    <>
      <div className="px-4 py-4 sm:px-6 lg:flex-auto lg:px-0 lg:py-4">
        <div className="mx-auto max-w-2xl space-y-8 sm:space-y-12 lg:mx-0 lg:max-w-none">
          <div>
            <h2 className="text-lg font-medium leading-7 text-gray-900">{t('profile')}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Manage {user.name}'s public profile.
            </p>

            <dl className="mt-6 space-y-3 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">
              <div className="pt-6 sm:flex">
                <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Full name</dt>
                <dd className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                  <div className="text-gray-900">{user.name}</div>
                  <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
                    Update
                  </button>
                </dd>
              </div>
              <div className="pt-6 sm:flex">
                <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Email address</dt>
                <dd className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                  <a href={`mailto:${user.email}`} className="block text-indigo-900 hover:underline">{user.email}</a>
                  <button type="button" className="hidden font-medium text-indigo-600 hover:text-indigo-500">
                    Update
                  </button>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-medium leading-7 text-gray-900">Authorization</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">Specify system-level entity access.</p>

            <ul role="list" className="mt-6 space-y-3 divide-y divide-gray-100 border-t border-gray-200 text-md leading-6">
              {authorizables.map((authorizable: AuthorizableWithType) => (
                <li key={authorizable.id} className="group pt-3 sm:flex cursor-pointer">
                  <div className="text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
                    {/* {authorizable.Icon && <authorizable.Icon className="inline -ml-0.5 mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />} */}
                    {t(authorizable.type)}
                  </div>
                  <div className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                    <div className="text-gray-900 font-medium">{authorizable.name}</div>
                    <button onClick={() => handleRevoke(authorizable)}
                      type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                      {t('revoke')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex pt-6">
              <ButtonGroup title="Grant Authorization"
                buttons={authorizationActions} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium leading-7 text-gray-900">Organizations</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">Manage organization memberships.</p>

            <ul role="list" className="mt-6 divide-y divide-gray-100 border-t border-gray-200 text-md leading-6">
              {user.organizations.map((organization: any) => (
                <li key={organization.id} className="group flex justify-between gap-x-6 py-4">
                  <div>
                    <span className="font-medium text-md text-gray-900 pr-3">{organization.displayName}</span>
                  </div>
                  <div className="hidden group-hover:block">
                    <button type="button" className="font-medium text-sm text-red-600 hover:text-red-500">
                      {t('remove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex pt-3">
              <button type="button" className="text-sm font-medium leading-6 text-indigo-600 hover:text-indigo-500">
                <span aria-hidden="true">+</span> Join another Organization
              </button>
            </div>
          </div>
        </div>
      </div>
      <SelectorModal ref={modal} onSelect={handleGrant}/>
      <ConfirmModal ref={confirm} onYes={onConfirmRevoke} />
    </>
  );
};


