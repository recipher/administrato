import { LoaderArgs, json } from '@remix-run/node';

import UserService from '~/models/users.server';
import OrganizationService from '~/models/organizations.server';

import Header from '~/components/header/with-actions';
import Alert, { Level } from '~/components/alert';

import { useLoaderData } from '@remix-run/react';
import List from '~/components/list/basic';
import { requireUser } from '~/auth/auth.server';

export const loader = async ({ request }: LoaderArgs) => {
  const u = await requireUser(request);
  const service = OrganizationService(); // UserService(u);
  const organizations = await service.listOrganizations(); // getOrganizations({ id });

  return json({ organizations });
};

export default () => {
  const { organizations } = useLoaderData();

  return (
    <>
      <Header title='Organizations' />

      {organizations.length <= 0 && <Alert title='No organizations found' level={Level.Warning} />}

      <List data={organizations} nameKey='displayName' />
    </>
  );
}
