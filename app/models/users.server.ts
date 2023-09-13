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

type OrgId = {
  organization?: string;
};

const toUser = ({ user_id: id, name, picture, email }: any) => ({
  id,
  name,
  picture,
  email,
});

export const getUser = async ({ id }: Id) => {
  return toUser(await client.getUser({ id }));
};

export const getUserRoles = async ({ id, organization }: Id & OrgId) => {
  return organization 
    ? client.organizations.getMemberRoles({ id: organization,  user_id: id })
    : client.getUserRoles({ id });
};

export const searchUsers = async ({ search, organization }: SearchOptions & OrgId, { offset = 0, limit = 20 }: QueryOptions) => {
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

export const getUserPermissionsForOrganisation = async (props: Id & OrgId) => {
  const roles = await getUserRoles(props);

  const permissions = await Promise.all(roles.map(async role =>
    client.getPermissionsInRole({ id: role.id as string })
  ));

  return permissions.flat();
};

export const getPermissions = async ({ id, organization }: Id & OrgId) => {
  return organization 
    ? getUserPermissionsForOrganisation({ id, organization })
    : client.getUserPermissions({ id });
};

const camelize = (s: string) => s.replace(/-./g, x=>x[1].toUpperCase());

type Org = { id: string, auth0id: string, displayName: string };
type KeyData = { 
  entity: string, 
  organization: Org,
  key: Array<number> 
};

const checkUser = (user: any) => {
  if (user === undefined) throw Error(`User not found`);
};

const checkOrganizations = (organization: Org, organizations: Array<any>) => {
  if (organization === undefined) return;
  if (organizations.map(o => o.id).includes(organization?.auth0id) === false) 
    throw Error(`User is not a member of ${organization.displayName}`);
};

const rebuildKeys = (keys: any, orgKey: string, entityKey: string, update: Array<Array<number>>) => {
  return { 
    keys: {
      ...keys,
      [orgKey]: {
        ...keys?.[orgKey],
        [entityKey]: update,
      }
    }
  };
}

export const addSecurityKey = async ({ id, entity, organization, key }: Id & KeyData) => {
  const user = await client.getUser({ id });

  checkUser(user);
  checkOrganizations(organization, await getOrganizations({ id }))

  const orgKey = organization ? organization.auth0id : 'default';
  const entityKey = camelize(entity);
  const existing = (user.app_metadata?.keys?.[orgKey]?.[entityKey]) || [];

  const update = [ ...existing, key ].reduce((keys: Array<Array<number>>, key: Array<number>) => {
    const [ start, end ] = key;
    return (keys.find(([ s, e ]) => s === start && e === end)) 
      ? keys : 
      [ ...keys, key ];
  }, []);

  const metadata = rebuildKeys(user.app_metadata?.keys, orgKey, entityKey, update);
  
  return updateMetadata({ id, metadata });
};

export const removeSecurityKey = async ({ id, entity, organization, key }: Id & KeyData) => {
  const user = await client.getUser({ id });

  checkUser(user);
  checkOrganizations(organization, await getOrganizations({ id }));

  const orgKey = organization ? organization.auth0id : 'default';
  const entityKey = camelize(entity);
  const existing = (user.app_metadata?.keys?.[orgKey]?.[entityKey]) || [];

  const [ start, end ] = key;
  const update = existing.reduce((keys: Array<Array<number>>, key: Array<number>) => {
    const [ s, e ] = key;
    return (s == start && e == end) ? keys : [ ...keys, [ s, e ]];
  }, []);

  const metadata = rebuildKeys(user.app_metadata?.keys, orgKey, entityKey, update);
  
  return updateMetadata({ id, metadata });
};

export const assignRole = async({ id, role, organization }: Id & { role: string, organization: Org }) => {
  const user = await client.getUser({ id });

  checkUser(user);
  checkOrganizations(organization, await getOrganizations({ id }));

  const roles = { roles: [ role ] };
  return organization
    ? client.organizations.addMemberRoles({ id: organization.auth0id, user_id: id }, roles)
    : client.assignRolestoUser({ id }, roles);
};

export const removeRole = async({ id, role, organization }: Id & { role: string, organization: Org }) => {
  const user = await client.getUser({ id });

  checkUser(user);
  checkOrganizations(organization, await getOrganizations({ id }));

  const roles = { roles: [ role ] };
  return organization
    ? client.organizations.removeMemberRoles({ id: organization.auth0id, user_id: id }, roles)
    : client.removeRolesFromUser({ id }, roles);
};

export const updateMetadata = async ({ id, metadata }: Id & { metadata: any }) => {
  const user = await client.getUser({ id });

  const { app_metadata: appMetadata } = user;
  const update = { ...appMetadata, ...metadata };

  return client.updateAppMetadata({ id }, update);
};

export const updateSettings = async ({ id, settings }: Id & { settings: any }) => {
  const user = await client.getUser({ id });

  const { user_metadata: userMetadata } = user;
  const update = { ...userMetadata, ...settings };

  return client.updateUserMetadata({ id }, update);
};

export const getTokenizedUser = async ({ id }: Id) => {
  const user = await client.getUser({ id });

  const organizations = await getOrganizations({ id });
  const organization = user.user_metadata?.organization; // No way to get orgId

  const permissions = await getPermissions({ id, organization });
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
