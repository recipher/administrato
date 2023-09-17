import { type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import UserService from '~/models/access/users.server';
import { requireUser } from '~/auth/auth.server';

import Header from '~/components/header/advanced';
import Alert, { Level } from '~/components/alert';
import Pagination from '~/components/pagination';
import toNumber from '~/helpers/to-number';

import { Basic as List } from '~/components/list';

const LIMIT = 20;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const search = url.searchParams.get("q");

  const u = await requireUser(request);
  const service = UserService(u);

  const organization = u.organization?.auth0id;
  const users = await service.searchUsers({ search }, { offset, limit: LIMIT });

  return { users, offset, limit: LIMIT, search, organization };
};

export default () => {
  const { users, search, offset, limit } = useLoaderData();

  return (
    <>
      <Header title='Users' filterTitle='Search users' />

      {users.length <= 0 && <Alert title={`No users found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={users} buildTo={({item: user }) => `${user.id}/profile`} />
      <Pagination entity='user' offset={offset} limit={limit} count={users.length} />
    </>
  );
}
