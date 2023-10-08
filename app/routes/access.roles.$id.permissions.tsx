import { useContext, useEffect, useState } from 'react';
import { type ActionArgs, type LoaderArgs, json } from '@remix-run/node';
import { Form, useFetcher, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useTranslation } from 'react-i18next';

import { badRequest, notFound } from '~/utility/errors';

import RoleService, { type Role, namespaces } from '~/services/access/roles.server';

import { Breadcrumb, BreadcrumbProps } from '~/layout/breadcrumbs';
import { requireUser } from '~/auth/auth.server';

import ToastContext from '~/hooks/use-toast';

import { Toggle } from '~/components/form';
import { Level } from '~/components/toast';
import Spinner from '~/components/spinner';
import Tabs from '~/components/tabs';

import { Layout, Heading } from '~/components/info/info';

import { security } from '~/auth/permissions';

export const handle = {
  name: "permissions",
  breadcrumb: ({ role, current, name }: { role: Role } & BreadcrumbProps) =>
    <Breadcrumb key={role?.id} to={`/access/roles/${role?.id}/permissions`} name={name} current={current} />
};

type MemberPermission = { 
  permission: string; 
  right: string;
  entity: string;
  isMember: boolean 
};

const determineMembership = (permissions: Array<any>, rolePermissions: Array<any>) => 
  permissions.map(permission => {
    const isMember = (p: string) => rolePermissions.includes(p);
    const [ right, entity ] = permission.split(":");
    return { 
      permission, 
      right,
      entity, 
      isMember: isMember(permission) 
    };
  }
);

const sortPermissions = (left: MemberPermission, right: MemberPermission) => {
  return left.right.localeCompare(right.right) || 
    left.entity.localeCompare(right.entity);
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const { id } = params;

  if (id === undefined) return badRequest();

  const u = await requireUser(request);
  const service = RoleService();

  const role = await service.getRole({ id });
  if (role === undefined) return notFound();

  const url = new URL(request.url);
  const namespace = url.searchParams.get("namespace") || Array.from(namespaces.keys()).at(0)

  if (namespace === undefined) return badRequest("Error");

  const permissions = await service.listPermissions({ namespace });
  const rolePermissions = await service.getRolePermissions({ id })

  return json({ role, namespace, namespaces: Array.from(namespaces.keys()),
    permissions: determineMembership(permissions, rolePermissions)
      .sort(sortPermissions)
   });
};

export async function action({ request }: ActionArgs) {
  // const u = await requireUser(request);
  const service = RoleService();

  let level = Level.Success, message = "";
  const { role, value, permission, description, namespace } = await request.json();
  if (value) {
    try {
      await service.assignPermission({ id: role.id, permission, namespace });
      message = `Permission Assigned:${description} assigned to role ${role.description}.`;
    } catch(e: any) {
      message = `Permission Assign Error:${e.messsage}`;
      level = Level.Error;
    }
  } else {
    try {
      await service.assignPermission({ id: role.id, permission, namespace });
      message = `Permission Removed:${description} removed from role ${role.description}.`;
    } catch(e: any) {
      message = `Permission Remove Error:${e.messsage}`;
      level = Level.Error;
    }
  }

  return json({ flash: { message, level }});
};

export default function Permissions() {
  const { createToast } = useContext(ToastContext);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [ permission, setPermission ] = useState<string | undefined>();

  const { role, permissions, namespace, namespaces } = useLoaderData();
  
  const handleChange = (permission: string, value: boolean) => {
    setPermission(permission);
    const [ right, entity ] = permission.split(":");
    fetcher.submit({ permission, namespace, description: `${t(right)} ${t(entity)}`, value, role }, 
      { method: "POST", encType: "application/json" });
  };

  const [ searchParams ] = useSearchParams();
  const qs = searchParams.toString() || '';
  const params = new URLSearchParams(qs);

  const handleClick = (namespace: string ) => {
    params.set("namespace", namespace);
    navigate(`?${params.toString()}`);
  }

  useEffect(() => {
    createToast(fetcher.data?.flash);
  }, [ fetcher, createToast ]);

  return (
    <Layout>
      <Heading heading="Select Permissions" explanation="Permissions grant the user access to functionality, where they have membership of this role." />

      <Tabs tabs={namespaces.map((value: string) => ({ name: t(value), value }))} selected={namespace} onClick={handleClick} />

      <Form method="POST" id="edit-role-permissions">
        <div className="mt-4 divide-y divide-gray-200 border-b">
          {permissions?.map(({ permission: p, right, entity, isMember }: MemberPermission) => (
            <div key={p} className="relative flex items-start">
              <div className="min-w-0 flex-1 text-md leading-6">
                <label htmlFor={p} className="py-3 block cursor-pointer text-gray-900">
                  <span className="mr-3">{t(right)} {t(entity)}</span>
                  {fetcher.state === 'submitting' && permission === p && <Spinner />}
                </label>
              </div>
              <div className="ml-3 my-3 flex h-6 items-center">
                <Toggle name={p} on={isMember} onChange={handleChange} />
              </div>
            </div>
          ))}
        </div>
      </Form>
    </Layout>
  );
};

