import { intlFormatDistance } from 'date-fns';
import { type LoaderArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useLocale } from 'remix-i18next';

import { ChevronRightIcon } from '@heroicons/react/24/outline';

import UserService, { type BasicUser as User } from '~/models/access/users.server';
import { requireUser } from '~/auth/auth.server';

import Header from '~/components/header/basic-with-filter';
import Alert, { Level } from '~/components/alert';
import Pagination from '~/components/pagination';
import Tooltip from '~/components/tooltip';
import Image from '~/components/image';
import { List } from '~/components/list';
import toNumber from '~/helpers/to-number';

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

const User = ((user: User) => (
  <>
    <Image className="h-12 w-12" src={user.picture} />
    <div className="min-w-0 flex-auto">
      <p className="text-md font-semibold leading-6 text-gray-900">
        {user.name}
      </p>
      <p className="mt-1 flex text-xs leading-5 text-gray-500">
        {user.email}
      </p>
    </div>
  </>
));

const Context = (user: User) => {
  const locale = useLocale();
  const now = new Date();
  const lastLogin = new Date(user.lastLogin);
  return (
    <>
      <Link to={`${user.id}/profile`} className="hidden shrink-0 text-sm sm:flex sm:flex-col sm:items-end">
        <p className="text-sm leading-6 text-gray-900">{user.settings?.role}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Last seen <time dateTime={lastLogin.toISOString()}>{intlFormatDistance(lastLogin, now)}</time>
        </p>
      </Link>
      <ChevronRightIcon className="h-5 w-5 flex-none text-gray-400" aria-hidden="true" />
    </>
  );
};

export default () => {
  const { users, search, offset, limit } = useLoaderData();

  return (
    <>
      <Header title='Users' filterTitle='Search users' />

      {users.length <= 0 && <Alert title={`No users found ${search === null ? '' : `for ${search}`}`} level={Level.Warning} />}

      <List data={users} renderItem={User} renderContext={Context} />
      <Pagination entity='user' offset={offset} limit={limit} count={users.length} />
    </>
  );
};
