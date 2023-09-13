import { json, type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import Header from '~/components/header/with-actions';

import { Breadcrumb } from "~/layout/breadcrumbs";
import UserService, { type User } from '~/models/users.server';
import { requireUser } from '~/auth/auth.server';

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

export default function User() {
  const { user } = useLoaderData();

  const tabs = [
    { name: 'profile', to: 'profile' },
    { name: 'roles', to: 'roles' },
    { name: 'organizations', to: 'organizations' },
  ];

  return (
    <>
      <Header title={user.name} subtitle={user.email} tabs={tabs} />
      <Outlet />
    </>
  );
};
