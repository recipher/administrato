import { useRef } from 'react';
import { json, type LoaderArgs, type ActionArgs, redirect } from '@remix-run/node';
import { Outlet, useLoaderData, useSubmit } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import UserService, { type User } from '~/models/access/users.server';
import { getSession, storage, mapProfileToUser, requireUser } from '~/auth/auth.server';
import refreshUser from '~/auth/refresh.server';
import { storage as flash, setFlashMessage } from '~/utility/flash.server';

import ConfirmModal, { type RefConfirmModal } from "~/components/modals/confirm";
import Header from '~/components/header';
import { Breadcrumb } from "~/layout/breadcrumbs";
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { ButtonType } from '~/components/button';
import { Level } from '~/components/toast';
import { useUser } from '~/hooks';

export const handle = {
  breadcrumb: ({ user, current }: { user: User, current: boolean }) =>
    <Breadcrumb key={user.id} to={`/access/users/${user?.id}`} name={user.name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const u = await requireUser(request);
  const service = UserService(u);

  const user = await service.getUser({ id });

  if (user === undefined) return notFound();

  return json({ user });
}

export async function action({ request }: ActionArgs) {
  const u = await requireUser(request);
  const service = UserService();

  let message = "", level = Level.Success;
  const { intent, ...props } = await request.json();
  let { redirectTo = "/profile" } = props;
  
  const headers = new Headers();

  if (intent === "unimpersonate") {
    const { user: { id, name }} = props;

    // const session = await getSession(request.headers.get("Cookie"));
    // const profile = await service.getTokenizedUser({ id });
    // session.set("user", mapProfileToUser(id, profile));
    // headers.append("Set-Cookie", await storage.commitSession(session));

    await refreshUser({ id, request, headers });

    message = `Stop Impersonation:You are now logged in as ${name}.`;
    level = Level.Success;
  }

  if (intent === "impersonate") {
    const { user: { id, name }} = props;

    const session = await getSession(request.headers.get("Cookie"));
    const profile = await service.getTokenizedUser({ id });
    const impersonation = { ...mapProfileToUser(id, profile), impersonator: { id: u.id, name: u.name }};

    session.set("user", impersonation);
    headers.append("Set-Cookie", await storage.commitSession(session));

    message = `Impersonation Successful:You are now logged in as ${name}.`;
    level = Level.Success;
  };
 
  const session = await setFlashMessage({ request, message, level });
  headers.append("Set-Cookie", await flash.commitSession(session));
  
  return redirect(redirectTo, { headers, status: 302 });
};

export default function User() {
  const u = useUser();
  const submit = useSubmit();
  const confirm = useRef<RefConfirmModal>(null);
  const { user } = useLoaderData();

  const impersonate = () =>
    confirm.current?.show("Impersonate this User?", "Yes, Impersonate", "Cancel", `Are you sure you want to impersonate ${user.name}?`);
  
  const onConfirmImpersonate = () => submit({ intent: "impersonate", user }, { action: `/access/users/${user.id}`, method: "post", encType: "application/json" });

  const tabs = [
    { name: 'profile', to: 'profile' },
    { name: 'authorizations', to: 'authorizations' },
    { name: 'roles', to: 'roles' },
    { name: 'organizations', to: 'organizations' },
  ];

  const actions = [
    { title: "impersonate", icon: UserCircleIcon, type: ButtonType.Secondary, 
      onClick: impersonate, disabled: u.id === user.id },
  ];

  return (
    <>
      <Header title={user.name} subtitle={user.email} icon={user.picture} tabs={tabs} actions={actions} allowSort={false} />
      <Outlet />
      <ConfirmModal ref={confirm} onYes={onConfirmImpersonate} />
    </>
  );
};
