import auth0 from 'auth0';

import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } from '../settings.server';

const client = new auth0.ManagementClient({
  domain: AUTH0_DOMAIN, 
  clientId: AUTH0_CLIENT_ID, 
  clientSecret: AUTH0_CLIENT_SECRET,
});

export default client;
