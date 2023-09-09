import { LoaderArgs } from '@remix-run/node';

import { listRoles } from '~/models/roles.server';

import Header from '~/components/header/with-actions';
import Alert, { Level } from '~/components/alert';

import { useLoaderData } from '@remix-run/react';
import List from '~/components/list/basic';

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
