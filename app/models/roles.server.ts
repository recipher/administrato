import client from './auth0.server';
// import { type User } from './users.server';
// import { type QueryOptions, type SearchOptions, ASC, DESC } from './types';

export type Role = {
  id: string;
  name: string;
  description: string;
};

type Id = {
  id: string;
};

const service = () => {
  const getRole = async ({ id }: Id) => {
    return client.getRole({ id });
  };

  const listRoles = async () => {
    return client.getRoles();  
  };

  return { getRole, listRoles };
};

export default service;
