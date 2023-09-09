import { LoaderArgs } from '@remix-run/node';

import { listRoles } from '~/models/roles.server';

import Header from '~/components/header/with-actions';
import Alert, { Level } from '~/components/alert';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { useLoaderData } from '@remix-run/react';
import { UsersIcon } from '@heroicons/react/24/outline';
import List from '~/components/list/basic';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UsersIcon} to='/access/roles' name="roles" current={current} />
};

export const loader = async ({ request }: LoaderArgs) => {
  const roles = await listRoles();

  return { roles };
};

export default () => {
  const { roles } = useLoaderData();

  return (
    <>
      <Header title='Roles' />

      {roles.length <= 0 && <Alert title='No roles found' level={Level.Warning} />}

      <List data={roles} nameKey='description' />
    </>
  );
}