import client from './auth0.server';

import { type QueryOptions, type SearchOptions, ASC, DESC } from './types';

export type Role = {
  id: string;
  name: string;
};

type Id = {
  id: string;
};

export const getRole = async ({ id }: Id) => {
  return client.getRole({ id });
};

export const listRoles = async () => {
  return client.getRoles();  
};
