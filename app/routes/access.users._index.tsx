import { LoaderArgs } from '@remix-run/node';

import { searchUsers } from '~/models/users.server';

import Header from '~/components/header/with-filter';
import Alert, { Level } from '~/components/alert';
import Pagination from '~/components/pagination';
import toNumber from '~/helpers/to-number';

import { useLoaderData } from '@remix-run/react';
import List from '~/components/list/basic';

const LIMIT = 20;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const search = url.searchParams.get("q");

  const users = await searchUsers({ search }, { offset, limit: LIMIT });

  return { users, offset, limit: LIMIT, search };
};

export default () => {
  const { users, search, offset, limit } = useLoaderData();

  return (
    <>
      <Header title='Users' filterTitle='Search users' filterParam='q' />

      {users.length <= 0 && <Alert title={`No users found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={users} />
      <Pagination entity='user' offset={offset} limit={limit} count={users.length} />
    </>
  );
}
