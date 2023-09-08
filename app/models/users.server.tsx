import client from './auth0.server';

const { DOMAIN: ns } = process.env;

type Id = {
  id: string;
};

type Organization = {
  organization: string;
};

export const getUser = async ({ id }: Id) => {
  return client.getUser({ id });
};

export const getOrganizations = async ({ id }: Id) => {
  return client.users.getUserOrganizations({ id });
};

export const getPermissions = async ({ id }: Id) => {
  return client.getUserPermissions({ id });
};

export const updateSettings = async ({ id, settings }: Id & { settings: any }) => {
  const user = await getUser({ id });

  const { user_metadata: userMetadata } = user;
  const metadata = { ...userMetadata, ...settings };

  return client.updateUserMetadata({ id }, metadata);
};

export const getTokenizedUser = async ({ id }: Id) => {
  const user = await getUser({ id });

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
