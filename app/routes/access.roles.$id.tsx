import { type LoaderArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import Header from '~/components/header/advanced';

import { Breadcrumb, BreadcrumbProps } from "~/layout/breadcrumbs";
import RoleService, { type Role } from '~/services/access/roles.server';

export const handle = {
  name: ({ role }: { role: Role }) => role.description,
  path: ({ role }: { role: Role }) => role.id,
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const service = RoleService();
  const role = await service.getRole({ id });

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
      <Header title={role.description} tabs={tabs} />
      <Outlet />
    </>
  );
};
