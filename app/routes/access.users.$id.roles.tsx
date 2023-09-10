import { type LoaderArgs } from '@remix-run/node';

import { badRequest, notFound } from '~/utility/errors';

import { getUser, getUserRoles, type User } from '~/models/users.server';
import { listRoles } from '~/models/roles.server';

import { withZod } from '@remix-validated-form/with-zod';
import { zfd } from 'zod-form-data';
import { z } from 'zod';

import { ValidatedForm as Form, validationError } from 'remix-validated-form';

import { Breadcrumb } from '~/layout/breadcrumbs';
import { requireUser } from '~/auth/auth.server';
import { useLoaderData } from '@remix-run/react';
import { Cancel, Submit, Toggle } from '~/components/form';

export const handle = {
  breadcrumb: ({ user, current }: { user: User, current: boolean }) =>
    <Breadcrumb key={user.id} to={`/access/users/${user.id}/roles`} name="roles" current={current} />
};

export const validator = withZod(
  zfd.formData({
  })
);

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

export default function Roles() {
  const { user, roles, userRoles } = useLoaderData();
  const ids = userRoles.map(r => r.id);

  const selected = id => ids.includes(id);

  return (
    <Form method="GET" validator={validator} id="edit-user-roles">    
      <fieldset className="mt-6">
        <legend className="text-lg leading-6 text-gray-500">Select Roles</legend>
        <div className="mt-4 divide-y divide-gray-200 border-b">
          {roles.map(({ id, description }) => (
            <div key={id} className="relative flex items-start">
              <div className="min-w-0 flex-1 text-lg leading-6">
                <label htmlFor={`role[${id}]`} className="py-4 block cursor-pointer text-gray-900">
                  {description}
                </label>
              </div>
              <div className="ml-3 my-4 flex h-6 items-center">
                <Toggle name={`role[${id}]`} on={selected(id)} />
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      <div className="mt-6 flex items-center justify-end gap-x-6">
        <Cancel />
        <Submit text="Save" submitting="Saving..." permission="security:edit:user" />
      </div>
    </Form>
  );
};
