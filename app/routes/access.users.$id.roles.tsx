import { useContext, useEffect, useState } from 'react';
import { type ActionArgs, type LoaderArgs, json } from '@remix-run/node';
import { Form, useFetcher, useLoaderData } from '@remix-run/react';

import { badRequest, notFound } from '~/utility/errors';

import UserService, { type User } from '~/services/access/users.server';
import RoleService, { type Role } from '~/services/access/roles.server';

import { useUser } from '~/hooks';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { requireUser } from '~/auth/auth.server';

import { Toggle } from '~/components/form';
import { Level } from '~/components/toast';
import Spinner from '~/components/spinner';
import { Layout, Heading } from '~/components/info/info';

import ToastContext from '~/hooks/use-toast';

import { security } from '~/auth/permissions';

export const handle = {
  name: "roles",
  breadcrumb: (props: BreadcrumbProps) => <Breadcrumb {...props} />
};

type MemberRole = Role & { isMember: boolean };

const determineMembership = (roles: Array<any>, userRoles: Array<any>) => 
  roles.map(role => {
    const ids = userRoles.map((r: Role) => r.id);
    const isMember = (id: string) => ids.includes(id);
    return { ...role, isMember: isMember(role.id) };
  }
);

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const u = await requireUser(request);
  const userService = UserService(u);
  const roleService = RoleService();

  const user = await userService.getUser({ id });
  if (user === undefined) return notFound();

  const roles = await roleService.listRoles();
  const userRoles = await userService.getUserRoles({ id })

  return { user, roles: determineMembership(roles, userRoles) };
};

export async function action({ request }: ActionArgs) {
  const u = await requireUser(request);
  const service = UserService(u);

  let level = Level.Success, message = "";
  const { role, value, user } = await request.json();

  if (value) {
    try {
      await service.assignRole({ id: user.id, role: role.id });
      message = `Role Assigned:${role.name} role assigned to ${user.name}.`;
    } catch(e: any) {
      message = `Role Assign Error:${e.messsage}`;
      level = Level.Error;
    }
  } else {
    try {
      await service.removeRole({ id: user.id, role: role.id });
      message = `Role Removed:${role.name} role removed from ${user.name}.`;
    } catch(e: any) {
      message = `Role Remove Error:${e.messsage}`;
      level = Level.Error;
    }
  }

  return json({ flash: { message, level }});
};

export default function Roles() {
  const u = useUser();

  const { createToast } = useContext(ToastContext);

  const fetcher = useFetcher();
  const [ role, setRole ] = useState<string | undefined>();

  const { user, roles } = useLoaderData();
  
  const hasPermission = (p: string) => u.permissions.includes(p);

  const handleChange = (id: string, value: boolean) => {
    const name = roles.find((r: Role) => r.id === id)?.description;
    setRole(id);
    fetcher.submit({ role: { id, name }, value, user }, 
      { method: "POST", encType: "application/json" });
  };

  useEffect(() => {
    createToast(fetcher.data?.flash);
  }, [ fetcher, createToast ]);

  return (
    <Layout>
      <Heading heading="Select Role Membership" explanation="Role memberships determine permissions, which grants the user access to functionality." />

      <Form method="POST" id="edit-user-roles">
        <div className="mt-4 divide-y divide-gray-200 border-b">
          {roles.map(({ id, description, isMember }: MemberRole) => (
            <div key={id} className="relative flex items-start">
              <div className="min-w-0 flex-1 text-md leading-6">
                <label htmlFor={id} className="py-4 block cursor-pointer text-gray-900">
                  <span className="mr-3">{description}</span>
                  {fetcher.state === 'submitting' && role === id && <Spinner />}
                </label>
              </div>
              <div className="ml-3 my-4 flex h-6 items-center">
                <Toggle name={id} on={isMember} onChange={handleChange} disabled={!hasPermission(security.edit.user)} />
              </div>
            </div>
          ))}
        </div>
      </Form>
    </Layout>
  );
};
