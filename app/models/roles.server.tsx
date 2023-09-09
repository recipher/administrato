import client from './auth0.server';

export const listRoles = async () => {
  return client.getRoles();  
};
