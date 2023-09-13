import { useRef, useState } from 'react';
import { ActionArgs, redirect, type LoaderArgs } from '@remix-run/node';
import { useLoaderData, useSubmit } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@heroicons/react/24/outline';

import { badRequest, notFound } from '~/utility/errors';

import { setFlashMessage, storage } from '~/utility/flash.server';
import { Organization, mapProfileToUser, requireUser } from '~/auth/auth.server';
import UserService, { type User } from '~/models/users.server';

import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";

import { Breadcrumb } from "~/layout/breadcrumbs";
import Button, { ButtonType } from '~/components/button';
import { Level } from '~/components/toast';
import { RefModal } from '~/components/modals/modal';
import { SelectorModal } from '~/components/access/organizations';

export const handle = {
  breadcrumb: ({ user, current }: { user: User, current: boolean }) =>
    <Breadcrumb key={user.id} to={`/access/users/${user.id}/organizations`} name="organizations" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const u = await requireUser(request);
  const service = UserService(u);
  const profile = await service.getTokenizedUser({ id });
  if (profile === undefined) return notFound();
  const user = mapProfileToUser(id, profile);

  return { user };
};

export async function action({ request }: ActionArgs) {
  const u = await requireUser(request);

  let message = "", level = Level.Success;
  const { intent, user, organization } = await request.json();

  const service = UserService(u);

  if (intent === 'leave-organization') {
    try {
      await service.leaveOrganization({ id: user.id, organization });
      message = `Organization Membership:${user.name} has left ${organization.displayName}.`;
    } catch(e: any) {
      message = `Organization Membership Error:${e.message}.`;
      level = Level.Error;
    };
  }

  if (intent === 'join-organization') {
    try {
      await service.joinOrganization({ id: user.id, organization });
      message = `Organization Membership:${user.name} has joined ${organization.displayName}.`;
    } catch(e: any) {
      message = `Organization Membership Error:${e.message}.`;
      level = Level.Error;
    };
  }

  const session = await setFlashMessage({ request, message, level });
  return redirect(".", { headers: { "Set-Cookie": await storage.commitSession(session) } });
};

export default function Organizations() {
  const { t } = useTranslation();
  const { user } = useLoaderData();
  const modal = useRef<RefModal>(null);
  const submit = useSubmit();
  const [ organization, setOrganization ] = useState<Organization>();

  const confirm = useRef<RefConfirmModal>(null);

  const handleLeave = (organization: Organization) => {
    setOrganization(organization);
    confirm.current?.show(
      "Leave Organization?", 
      "Yes, Leave", "Cancel", 
      `Are you sure you want ${user.name} to leave ${organization.displayName}?`);
  };

  const onConfirmLeave = () => {
    if (organization === undefined) return;
    submit({ intent: "leave-organization", 
             organization,
             user: { id: user.id, name: user.name },
           },
      { method: "post", encType: "application/json" });
  };

  const handleJoin = (organization: Organization) => {
    submit({ intent: "join-organization", 
             organization,
             user: { id: user.id, name: user.name }},
      { method: "post", encType: "application/json" });
  };

  const showModal = () => modal.current?.show();

  return (
    <>
      <div className="px-4 py-4 sm:px-6 lg:flex-auto lg:px-0 lg:py-4">
        <div className="mx-auto max-w-2xl space-y-8 sm:space-y-12 lg:mx-0 lg:max-w-none">
          <div>
            <h2 className="text-lg font-medium leading-7 text-gray-900">Organizations</h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">Manage organization memberships.</p>

            <ul role="list" className="mt-6 divide-y divide-gray-100 border-t border-gray-200 text-md leading-6">
              {user.organizations.map((organization: any) => (
                <li key={organization.id} className="group flex justify-between gap-x-6 py-4 cursor-pointer">
                  <div>
                    <span className="font-medium text-md text-gray-900 pr-3">{organization.displayName}</span>
                  </div>
                  <div className="hidden group-hover:block">
                    <button onClick={() => handleLeave(organization)}
                      type="button" className="hidden group-hover:block font-medium text-red-600 hover:text-red-500">
                      {t('revoke')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex pt-3">
              <Button icon={PlusIcon} title={t('Join another Organization')} 
                type={ButtonType.Secondary} onClick={showModal} />
            </div>
          </div>
        </div>
      </div>
      <SelectorModal modal={modal} onSelect={handleJoin} />
      <ConfirmModal ref={confirm} onYes={onConfirmLeave} />
    </>
  );
};


