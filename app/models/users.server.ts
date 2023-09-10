import client from './auth0.server';

const { DOMAIN: ns } = process.env;

import { type QueryOptions, type SearchOptions, ASC, DESC } from './types';

export type User = {
  id: string;
  email: string;
  picture: string;
  name: string;
};

type Id = {
  id: string;
};

type Organization = {
  organization?: string;
};

export const getUser = async ({ id }: Id) => {
  return toUser(await client.getUser({ id }));
};

export const getUserRoles = async ({ id, organization }: Id & Organization) => {
  return organization 
    ? client.organizations.getMemberRoles({ id: organization,  user_id: id })
    : client.getUserRoles({ id });
};

const toUser = ({ user_id: id, name, picture, email }: any) => ({
  id,
  name,
  picture,
  email,
});

export const searchUsers = async ({ search, organization }: SearchOptions & Organization, { offset = 0, limit = 20 }: QueryOptions) => {
  if (search == null) search = '';

  const q = organization 
    ? `organization_id:${organization} AND name:*${search}*` 
    : `name:*${search}*`;

  const users = await client.getUsers({
    search_engine: 'v3',
    q,
    per_page: limit,
    page: offset = 0 ? 0 : Math.round(offset / limit)
  });
  return users.map(toUser);
};

export const getOrganizations = async ({ id }: Id) => {
  return client.users.getUserOrganizations({ id });
};

export const getPermissions = async ({ id }: Id) => {
  return client.getUserPermissions({ id });
};

export const updateSettings = async ({ id, settings }: Id & { settings: any }) => {
  const user = await client.getUser({ id });

  const { user_metadata: userMetadata } = user;
  const metadata = { ...userMetadata, ...settings };

  return client.updateUserMetadata({ id }, metadata);
};

export const getTokenizedUser = async ({ id }: Id) => {
  const user = await client.getUser({ id });

  const permissions = await getPermissions({ id });
  const organizations = await getOrganizations({ id });

  const namespaces = permissions.reduce((ns, perm) =>
    ns.includes(perm.resource_server_identifier as never) 
      ? ns 
      : ns.concat(perm.resource_server_identifier as never)
  , []);

  let perms = {};

  namespaces.forEach(ns => {
    const names = permissions
      .filter(p => p.resource_server_identifier === ns)
      .map(p => p.permission_name);

    perms = { ...perms,  [`${ns}permissions`]: names };
  });

  return { 
    ...user, ...perms, ...organizations, id,
    [`${ns}organizations`]: organizations,
    [`${ns}settings`]: user.user_metadata,
    [`${ns}metadata`]: user.app_metadata,
  };
};
