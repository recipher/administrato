import { useRef, useState } from 'react';
import { ActionArgs, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import { setFlashMessage, storage } from '~/utility/flash.server';
import { mapProfileToUser, requireUser } from '~/auth/auth.server';
import UserService, { type User } from '~/models/access/users.server';
import ServiceCentreService, { type ServiceCentre } from '~/models/manage/service-centres.server';
import ClientService, { type Client } from '~/models/manage/clients.server';
import LegalEntityService, { type LegalEntity } from '~/models/manage/legal-entities.server';
import ProviderService, { type Provider } from '~/models/manage/providers.server';

import { useUser } from '~/hooks';

import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import { SelectorModal, RefSelectorModal, entities } from '~/components/manage/selector';
import Alert, { Level } from '~/components/alert';

import { Breadcrumb } from "~/layout/breadcrumbs";
import ButtonGroup, { type ButtonGroupButton } from '~/components/button-group';

import { security } from '~/auth/permissions';

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
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest();

  const service = UserService();
  const profile = await service.getTokenizedUser({ id });

  if (profile === undefined) return notFound();
  const user = mapProfileToUser(id, profile);

  const serviceCentreService = ServiceCentreService(u);
  const clientService = ClientService(u);
  const legalEntityService = LegalEntityService(u);
  const providerService = ProviderService(u);
  const serviceCentres = await serviceCentreService.listServiceCentresForKeys({ keys: user?.keys.serviceCentre });
  const clients = await clientService.listClientsForKeys({ keys: user?.keys.client });
  const legalEntities = await legalEntityService.listLegalEntitiesForKeys({ keys: user?.keys.legalEntity });
  const providers = await providerService.listProvidersForKeys({ keys: user?.keys.provider });

  return { user, profile, authorizables: [
    ...toAuthorizables('service-centre', serviceCentres),
    ...toAuthorizables('client', clients),
    ...toAuthorizables('legal-entity', legalEntities),
    ...toAuthorizables('provider', providers),
  ]};
};

export async function action({ request }: ActionArgs) {
  const u = await requireUser(request);

  const service = UserService(u);
  let message = "", level = Level.Success;
  const { intent, user, key, entity } = await request.json();

  if (intent === 'revoke-authorization') {
    try {
      await service.removeSecurityKey({ id: user.id, organization: u.organization, entity: entity.type, key });
      message = `Authorization Revoked:Authorization to ${entity.translated} ${entity.name} was revoked from ${user.name}.`;
    } catch(e: any) {
      message = `Authorization Revoke Error:${e.message}.`;
      level = Level.Error;
    };
  }

  if (intent === 'grant-authorization') {
    try {
      await service.addSecurityKey({ id: user.id, organization: u.organization, entity: entity.type, key });
      message = `Authorization Granted:Authorization to ${entity.translated} ${entity.name} was granted to ${user.name}.`;
    } catch(e: any) {
      message = `Authorization Grant Error:${e.message}`;
      level = Level.Error;
    };
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(".", {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
};

export default function Profile() {
  const u = useUser();
  const { t } = useTranslation();
  const { user, authorizables } = useLoaderData();
  const modal = useRef<RefSelectorModal>(null);
  const submit = useSubmit();
  const [ entity, setEntity ] = useState<AuthorizableWithType>();

  const confirm = useRef<RefConfirmModal>(null);

  const handleRevoke = (entity: AuthorizableWithType) => {
    setEntity(entity);
    confirm.current?.show(
      "Revoke Authorization?", 
      "Yes, Revoke", "Cancel", 
      `Are you sure you want to revoke authorization to ${t(entity.type)} ${entity.name}?`);
  };

  const hasPermission = (p: string) => u.permissions.includes(p);

  const onConfirmRevoke = () => {
    if (entity === undefined) return;
    submit({ intent: "revoke-authorization", 
             user: { id: user.id, name: user.name },
             key: [ entity.keyStart, entity.keyEnd ], 
             entity: { name: entity.name, translated: t(entity.type), type: entity.type }}, 
      { method: "post", encType: "application/json" });
  };

  const handleGrant = (entity: AuthorizableWithType, type: string) => {
    submit({ intent: "grant-authorization", 
             user: { id: user.id, name: user.name },
             key: [ entity.keyStart, entity.keyEnd ], 
             entity: { name: entity.name, translated: t(type), type }}, 
      { method: "post", encType: "application/json" });
  };

  const showModal = (entity: string) => modal.current?.show(entity);

  const authorizationActions: Array<ButtonGroupButton> = Array.from(entities.keys()).map(key => (
    { title: key, onClick: () => showModal(key), Icon: entities.get(key).Icon }
  ));

  return (
    <>
      <div className="px-4 py-4 sm:px-6 lg:flex-auto lg:px-0 lg:py-4">
        <div className="mx-auto max-w-2xl space-y-8 sm:space-y-12 lg:mx-0 lg:max-w-none">
          <div>
            <h2 className="text-lg font-medium leading-7 text-gray-900">Authorization</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">Specify system-level entity access.</p>

            {authorizables.length === 0 && <Alert title='No authorizations' level={Level.Warning} />}
            {authorizables.length > 0 && <ul role="list" className="mt-6 space-y-3 divide-y divide-gray-100 border-t border-gray-200 text-md leading-6">
              {authorizables.map((authorizable: AuthorizableWithType) => (
                <li key={authorizable.id} className="group pt-3 sm:flex cursor-pointer">
                  <div className="text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
                    {/* {authorizable.Icon && <authorizable.Icon className="inline -ml-0.5 mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />} */}
                    {t(authorizable.type)}
                  </div>
                  {hasPermission(security.edit.user) && <div className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                    <div className="text-gray-900 font-medium">{authorizable.name}</div>
                    <button onClick={() => handleRevoke(authorizable)}
                      type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                      {t('revoke')}
                    </button>
                  </div>}
                </li>
              ))}
            </ul>}

            {hasPermission(security.edit.user) && <div className="flex pt-6">
              <ButtonGroup title="Grant Authorization"
                buttons={authorizationActions} />
            </div>}
          </div>
        </div>
      </div>
      <SelectorModal ref={modal} onSelect={handleGrant} />
      <ConfirmModal ref={confirm} onYes={onConfirmRevoke} />
    </>
  );
};


