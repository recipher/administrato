import type * as s from 'zapatos/schema';
import * as db from 'zapatos/db';
import pool from '../db.server';

import { default as create } from '../id.server';

import client from './auth0.server';

const { DOMAIN: ns } = process.env;

import { type QueryOptions, type SearchOptions } from '../types';

import { type User } from '~/auth/auth.server';
export { type User };

import { type Org } from './organizations.server';

type Id = {
  id: string;
};

type OrgId = {
  organization?: string;
};

type KeyData = { 
  entity: string, 
  organization: Org,
  key: Array<number> 
};

export type BasicUser = {
  id: string;
  name: string;
  email: string;
  picture: string;
  lastLogin: Date;
  settings: any;
};

const service = (u?: User) => {
  const organization = u?.organization;

  const toUser = ({ user_id: id, name, picture, email, last_login: lastLogin, user_metadata: settings }: any) => ({
    id,
    name,
    picture,
    email,
    lastLogin: new Date(lastLogin),
    settings,
  });

  const camelize = (s: string) => s.replace(/-./g, x=>x[1].toUpperCase());
  
  const checkUser = (user: any) => {
    if (user === undefined) throw Error(`User not found`);
  };
  
  const checkOrganizations = (organizations: Array<any>, organization?: Org, ) => {
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
  };

  const getUser = async ({ id }: Id) => {
    return toUser(await client.getUser({ id }));
  };
  
  const getUserRoles = async ({ id }: Id) => {
    return organization 
      ? client.organizations.getMemberRoles({ id: organization.auth0id,  user_id: id })
      : client.getUserRoles({ id });
  };
  
  const searchUsers = async ({ search }: SearchOptions, { offset = 0, limit = 20 }: QueryOptions) => {
    if (search == null) search = '';
  
    const q = organization 
      ? `organization_id:${organization?.auth0id} AND name:*${search}*` 
      : `name:*${search}*`;
  
    const users = await client.getUsers({
      search_engine: 'v3',
      q,
      per_page: limit,
      page: offset = 0 ? 0 : Math.round(offset / limit)
    });
    return users.map(toUser);
  };
  
  const getOrganizations = async ({ id }: Id) => {
    return client.users.getUserOrganizations({ id });
  };
  
  const getUserPermissionsForOrganisation = async ({ id }: Id) => {
    const roles = await getUserRoles({ id });
  
    const permissions = await Promise.all(roles.map(async role =>
      client.getPermissionsInRole({ id: role.id as string })
    ));
  
    return permissions.flat();
  };
  
  const getPermissions = async ({ id }: Id & OrgId) => {
    return organization 
      ? getUserPermissionsForOrganisation({ id })
      : client.getUserPermissions({ id });
  };
  
  const addSecurityKey = async ({ id, entity, organization, key }: Id & KeyData) => {
    const user = await client.getUser({ id });
  
    checkUser(user);
    checkOrganizations(await getOrganizations({ id }), organization)
  
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
    
    await updateMetadata({ id, metadata });

    const [ keyStart, keyEnd ] = key;
    const authorization = create({ user: id, organization: orgKey, keyStart, keyEnd, entity });
    const [inserted] = await db.sql<s.authorizations.SQL, s.authorizations.Selectable[]>`
      INSERT INTO ${'authorizations'} (${db.cols(authorization)})
      VALUES (${db.vals(authorization)}) RETURNING *`
    .run(pool);

    return inserted;
  };
  
  const removeSecurityKey = async ({ id, entity, organization, key }: Id & KeyData) => {
    const user = await client.getUser({ id });
  
    checkUser(user);
    checkOrganizations(await getOrganizations({ id }), organization);
  
    const orgKey = organization ? organization.auth0id : 'default';
    const entityKey = camelize(entity);
    const existing = (user.app_metadata?.keys?.[orgKey]?.[entityKey]) || [];
  
    const [ start, end ] = key;
    const update = existing.reduce((keys: Array<Array<number>>, key: Array<number>) => {
      const [ s, e ] = key;
      return (s == start && e == end) ? keys : [ ...keys, [ s, e ]];
    }, []);
  
    const metadata = rebuildKeys(user.app_metadata?.keys, orgKey, entityKey, update);
    
    await updateMetadata({ id, metadata });

    const [ keyStart, keyEnd ] = key;
    const authorization = { user: id, organization: orgKey, keyStart, keyEnd, entity };
    await db.sql<s.authorizations.SQL>`
      DELETE FROM ${'authorizations'} 
      WHERE ${{...authorization}}`
    .run(pool);
  };
  
  const assignRole = async({ id, role }: Id & { role: string }) => {
    const user = await client.getUser({ id });
  
    checkUser(user);
    checkOrganizations(await getOrganizations({ id }), organization);
  
    const roles = [ role ];
    return organization
      ? client.organizations.addMemberRoles({ id: organization?.auth0id, user_id: id }, { roles })
      : client.assignRolestoUser({ id }, { roles });
  };
  
  const removeRole = async({ id, role }: Id & { role: string }) => {
    const user = await client.getUser({ id });
  
    checkUser(user);
    checkOrganizations(await getOrganizations({ id }), organization);
  
    const roles = [ role ];
    return organization
      ? client.organizations.removeMemberRoles({ id: organization.auth0id, user_id: id }, { roles })
      : client.removeRolesFromUser({ id }, { roles });
  };

    
  const joinOrganization = async({ id, organization: org }: Id & { organization: Org }) => {
    const user = await client.getUser({ id });
  
    checkUser(user);
    checkOrganizations(await getOrganizations({ id }), organization);
  
    const members = [ id ];
    return client.organizations.addMembers({ id: org.auth0id }, { members });
  };
  
  const leaveOrganization = async({ id, organization: org }: Id & { organization: Org }) => {
    const user = await client.getUser({ id });
  
    checkUser(user);
    checkOrganizations(await getOrganizations({ id }), organization);
  
    const members = [ id ];
    return client.organizations.removeMembers({ id: org.auth0id }, { members });
  };
  
  const updateMetadata = async ({ id, metadata }: Id & { metadata: any }) => {
    const user = await client.getUser({ id });
  
    const { app_metadata: appMetadata } = user;
    const update = { ...appMetadata, ...metadata };
  
    return client.updateAppMetadata({ id }, update);
  };
  
  const updateSettings = async ({ id, settings }: Id & { settings: any }) => {
    const user = await client.getUser({ id });
  
    const { user_metadata: userMetadata } = user;
    const update = { ...userMetadata, ...settings };
  
    return client.updateUserMetadata({ id }, update);
  };
  
  const getTokenizedUser = async ({ id }: Id) => {
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

  return {
    getUser,
    getUserRoles,
    getTokenizedUser,
    getOrganizations,
    getPermissions,
    searchUsers,
    updateMetadata,
    updateSettings,
    assignRole,
    removeRole,
    joinOrganization,
    leaveOrganization,
    addSecurityKey,
    removeSecurityKey,
  };
};

export default service;