import { type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';

import { Breadcrumb } from "~/layout/breadcrumbs";
import RoleService, { type Role } from '~/models/access/roles.server';

export const handle = {
  breadcrumb: ({ role, current }: { role: Role, current: boolean }) =>
    <Breadcrumb key={role.id} to={`/access/roles/${role.id}/permissions`} name="permissions" current={current} />
};

export const loader = async ({ params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const service = RoleService();
  const role = await service.getRole({ id });

  if (role === undefined) return notFound();

  return { role };
};

export default function Permissions() {
  return null;
};