import { type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { getUser, type User } from '~/models/users.server';

export const handle = {
  breadcrumb: ({ user, current }: { user: User, current: boolean }) =>
    <Breadcrumb key={user.id} to={`/access/users/${user.id}/authorization`} name="authorization" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const user = await getUser({ id });

  if (user === undefined) return notFound();

  return { user };
};

export default function Authorization() {
  return null;
};
