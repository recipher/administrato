import { type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import Header from '~/components/header/with-actions';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { getRole, type Role } from '~/models/roles.server';

export const handle = {
  breadcrumb: ({ role, current }: { role: Role, current: boolean }) =>
    <Breadcrumb key={role.id} to={`/access/roles/${role.id}`} name={role.name} current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const role = await getRole({ id });

  if (role === undefined) return notFound();

  return { role };
};

export default function User() {
  const { role } = useLoaderData();

  const tabs = [
    { name: 'permissions', to: 'permissions' },
  ];

  return (
    <>
      <Header title={role.name} tabs={tabs} />
      <Outlet />
    </>
  );
};
