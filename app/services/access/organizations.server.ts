import client from './auth0.server';
// import { type User } from './users.server';
// import { type QueryOptions, type SearchOptions, ASC, DESC } from './types';

type Id = {
  id: string;
};

export type Org = { id: string, auth0id: string, displayName: string };

const Service = () => {

  const toOrganization = ({ id: auth0id, name, display_name: displayName, metadata: { id }}: any) => ({
    id,
    name,
    displayName,
    auth0id,
  });

  const getOrganization = async ({ id }: Id) => {
    return toOrganization(await client.organizations.getByID({ id }));
  };

  const listOrganizations = async () => {
    return (await client.organizations.getAll()).map(toOrganization);  
  };

  return { getOrganization, listOrganizations };
};

export default Service;
