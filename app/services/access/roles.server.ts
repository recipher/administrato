import client from './auth0.server';
// import { type User } from './users.server';
// import { type QueryOptions, type SearchOptions, ASC, DESC } from './types';

const DOMAIN = "recipher.co.uk";

export const namespaces = new Map<string, string>([
  [ "manage", "64f893f993949d17ae4c1a8a" ],
  [ "schedule", "64f89364211d8e5230ce4583" ],
  [ "security", "64f9b4d5303b1e64829c27a9" ],  
]);

export type Role = {
  id: string;
  name: string;
  description: string;
};

type Id = {
  id: string;
};

const Service = () => {
  const getRole = async ({ id }: Id) => {
    return client.getRole({ id });
  };

  const listRoles = async () => {
    return client.getRoles();  
  };

  const getRolePermissions = async ({ id }: Id) => {
    const permissions = await client.getPermissionsInRole({ id });
    return permissions?.map((permission: any) => permission.permission_name);  
  };

  const listPermissions = async ({ namespace }: { namespace: string }) => {
    const id = namespaces.get(namespace)?.valueOf();

    if (id === undefined) throw new Error("Resource server not found");

    const { scopes } = await client.getResourceServer({ id });

    return scopes?.map((({ value }: { value: string}) => value)) || [];
  };
  
  const assignPermission = async ({ id, permission, namespace }: Id & { permission: string, namespace: string }) => {
    const resourceServiceId = `https://${namespace}.${DOMAIN}/`;
    return client.addPermissionsInRole({ id }, 
      { permissions: [{ resource_server_identifier: resourceServiceId, 
                        permission_name: permission }]});
  };

  const removePermission = async ({ id, permission, namespace }: Id & { permission: string, namespace: string }) => {
    const resourceServiceId = `https://${namespace}.${DOMAIN}/`;
    return client.removePermissionsFromRole({ id }, 
      { permissions: [{ resource_server_identifier: resourceServiceId, 
                        permission_name: permission }]});
  };

  return { 
    getRole, 
    listRoles,
    getRolePermissions,
    listPermissions,
    assignPermission,
    removePermission,
  };
};

export default Service;
