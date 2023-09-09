import { LoaderArgs } from '@remix-run/node';

import { searchUsers } from '~/models/users.server';

import Header from '~/components/header/with-filter';
import Alert, { Level } from '~/components/alert';
import Pagination from '~/components/pagination';
import pluralize from '~/helpers/pluralize';
import toNumber from '~/helpers/to-number';
import { useUser } from '~/hooks';

import { Breadcrumb } from "~/layout/breadcrumbs";
import { useLoaderData } from '@remix-run/react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export const handle = {
  breadcrumb: ({ current }: { current: boolean }) => 
    <Breadcrumb Icon={UserCircleIcon} to='/access/users' name="Users" current={current} />
};

const LIMIT = 20;

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const offset = toNumber(url.searchParams.get("offset") as string);
  const search = url.searchParams.get("q");
  const sort = url.searchParams.get("sort");

  const users = await searchUsers({ search }, { offset, limit: LIMIT });
  // const count = await countCountries({ search });

  return { users: [], count: 0, offset: 0, limit: LIMIT, search };
};

export default () => {
  const { search, count, offset, limit } = useLoaderData();

  return (
    <>
      <Header title='Users' filterTitle='Search users' filterParam='q' />

      {count <= 0 && <Alert title={`No users found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <Pagination entity='user' totalItems={count} offset={offset} limit={limit} />
    </>
  );
}