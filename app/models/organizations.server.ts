import client from './auth0.server';
// import { type User } from './users.server';
// import { type QueryOptions, type SearchOptions, ASC, DESC } from './types';

type Id = {
  id: string;
};

const service = () => {
  const getOrganization = async ({ id }: Id) => {
    return client.organizations.getByID({ id });
  };

  const listOrganizations = async () => {
    return client.organizations.getAll();  
  };

  return { getOrganization, listOrganizations };
};

export default service;
