import { ActionArgs, json, type LoaderArgs } from '@remix-run/node';
import { Form, useFetcher, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import { getUser, getUserRoles, type User } from '~/models/users.server';
import { listRoles, type Role } from '~/models/roles.server';

import { Breadcrumb } from '~/layout/breadcrumbs';
import { requireUser } from '~/auth/auth.server';

import { Cancel, Submit, Toggle } from '~/components/form';
import Alert, { Level } from '~/components/alert';

import ToastContext from '~/hooks/use-toast';
import { useContext, useEffect } from 'react';

import { security } from '~/auth/permissions';

export const handle = {
  breadcrumb: ({ user, current }: { user: User, current: boolean }) =>
    <Breadcrumb key={user.id} to={`/access/users/${user.id}/roles`} name="roles" current={current} />
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const u = await requireUser(request);

  const user = await getUser({ id });
  if (user === undefined) return notFound();

  const roles = await listRoles();
  const userRoles = await getUserRoles({ id, organization: u.organization?.auth0id })

  return { user, roles, userRoles };
};

export async function action({ request }: ActionArgs) {
  let level = Level.Success, message = "";
  const { role: { id, name: role }, value, user: { id: user, name }} = await request.json();

  if (value) {
    message = `Role Assigned:${role} role assigned to ${name}.`;
  } else {
    message = `Role Removed:${role} role removed from ${name}.`;
  }

  return json({ flash: { message, level }});
};

export default function Roles() {
  const { createToast } = useContext(ToastContext);

  const fetcher = useFetcher();

  const { user, roles, userRoles } = useLoaderData();
  const ids = userRoles.map((r: Role) => r.id);

  const selected = (id: string) => ids.includes(id);

  const handleChange = (id: string, value: boolean) => {
    const name = roles.find((r: Role) => r.id === id)?.description;
    fetcher.submit({ role: { id, name }, value, user }, 
      { method: "POST", encType: "application/json" });
  };

  useEffect(() => {
    createToast(fetcher.data?.flash);
  }, [ fetcher ]);

  return (
    <div className="px-4 py-4 sm:px-6 lg:flex-auto lg:px-0 lg:py-4">
      <h2 className="text-lg font-medium leading-7 text-gray-900">Select Role Membership</h2>
      <p className="mt-1 text-sm leading-6 text-gray-500">
        Role memberships determine permissions, which grants the user access to functionality.
      </p>

      <Form method="POST" id="edit-user-roles">
        <div className="mt-4 divide-y divide-gray-200 border-b">
          {roles.map(({ id, description }: Role, i: number) => (
            <div key={id} className="relative flex items-start">
              <div className="min-w-0 flex-1 text-md leading-6">
                <label htmlFor={id} className="py-4 block cursor-pointer text-gray-900">
                  {description}
                </label>
              </div>
              <div className="ml-3 my-4 flex h-6 items-center">
                <Toggle name={id} on={selected(id)} onChange={handleChange} />
              </div>
            </div>
          ))}
        </div>
      </Form>
    </div>
  );
};
