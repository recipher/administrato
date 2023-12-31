import { useRef, useState } from 'react';
import { ActionArgs, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import { setFlashMessage, storage } from '~/utility/flash.server';
import { mapProfileToUser, requireUser } from '~/auth/auth.server';
import UserService, { type User } from '~/services/access/users.server';
import SecurityGroupService, { type SecurityGroup } from '~/services/manage/security-groups.server';
import ClientService, { type Client } from '~/services/manage/clients.server';
import LegalEntityService, { type LegalEntity } from '~/services/manage/legal-entities.server';
import ProviderService, { type Provider } from '~/services/manage/providers.server';

import { useUser } from '~/hooks';

import ConfirmModal, { RefConfirmModal } from "~/components/modals/confirm";
import { SelectorModal, RefSelectorModal, entities } from '~/components/manage/entity-selector';
import Alert, { Level } from '~/components/alert';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import ButtonGroup, { type ButtonGroupButton } from '~/components/button-group';
import { Layout, Heading } from '~/components/info/info';

import { security } from '~/auth/permissions';

export const handle = {
  name: "authorizations",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

type Authorizable = (LegalEntity | Client | Provider | SecurityGroup);
type AuthorizableWithType = Authorizable & { type: string, Icon?: any };

const toAuthorizables = (type: string, authorizables: Array<Authorizable>) => {
  return authorizables.map(auth => ({ ...auth, type, Icon: entities.get(type).Icon }));
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const u = await requireUser(request);

  const { id } = params;

  if (id === undefined) return badRequest();

  const service = UserService();
  const profile = await service.getTokenizedUser({ id });

  if (profile === undefined) return notFound();
  const user = mapProfileToUser(id, profile);

  const securityGroupService = SecurityGroupService(u);
  const clientService = ClientService(u);
  const legalEntityService = LegalEntityService(u);
  const providerService = ProviderService(u);
  const securityGroups = await securityGroupService.listSecurityGroupsForKeys({ keys: user?.keys.securityGroup });
  const clients = await clientService.listClientsForKeys({ keys: user?.keys.client });
  const legalEntities = await legalEntityService.listLegalEntitiesForKeys({ keys: user?.keys.legalEntity });
  const providers = await providerService.listProvidersForKeys({ keys: user?.keys.provider });

  return { user, profile, authorizables: [
    ...toAuthorizables('security-group', securityGroups),
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
      <Layout>
        <Heading heading="Authorization" explanation="Authorizations grant access to data within the system." />

        {authorizables.length === 0 && <Alert title='No authorizations' level={Level.Warning} />}
        {authorizables.length > 0 && <ul role="list" className="mt-6 space-y-3 divide-y divide-gray-100 border-t border-gray-200 text-md leading-6">
          {authorizables.map((authorizable: AuthorizableWithType) => (
            <li key={authorizable.id} className="group pt-3 sm:flex cursor-pointer">
              <div className="text-gray-900 sm:w-64 sm:flex-none sm:pr-6">
                {/* {authorizable.Icon && <authorizable.Icon className="inline -ml-0.5 mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />} */}
                {/* @ts-ignore */}
                {t(authorizable.type)} {authorizable.parentId ? t('group') : null}
              </div>
              <div className="mt-1 flex justify-between gap-x-4 sm:mt-0 sm:flex-auto">
                <div className="text-gray-900 font-medium">{authorizable.name}</div>
                {hasPermission(security.edit.user) && <button onClick={() => handleRevoke(authorizable)}
                  type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                  {t('revoke')}
                </button>}
              </div>
            </li>
          ))}
        </ul>}

        {hasPermission(security.edit.user) && <div className="flex pt-6">
          <ButtonGroup title="Grant Authorization"
            buttons={authorizationActions} />
        </div>}
      </Layout>
      <SelectorModal ref={modal} onSelect={handleGrant} />
      <ConfirmModal ref={confirm} onYes={onConfirmRevoke} />
    </>
  );
};

