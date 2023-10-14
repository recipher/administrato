import { intlFormatDistance } from 'date-fns';
import { type LoaderArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import UserService, { type BasicUser as User } from '~/services/access/users.server';
import { requireUser } from '~/auth/auth.server';

import Header from '~/components/header/basic-with-filter';
import Alert, { Level } from '~/components/alert';
import Pagination from '~/components/pagination';
import Image from '~/components/image';
import { List, ListContext, ListItem } from '~/components/list';
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

  return json({ users, offset, limit: LIMIT, search, organization });
};

const User = (user: User) => 
  <ListItem data={user.name} sub={user.email} image={<Image className="h-12 w-12 rounded-md" src={user.picture} />} />

const Context = (user: User) => {
  const now = new Date();
  const lastLogin = new Date(user.lastLogin);
  return <ListContext data={user.settings?.role}
            sub={<>{'Last seen '}<time dateTime={lastLogin.toISOString()}>
              {intlFormatDistance(lastLogin, now)}</time></>} />
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
