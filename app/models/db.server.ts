import pg from 'pg';

import { DATABASE_URL } from './settings.server';

const pool = new pg.Pool({ connectionString: DATABASE_URL });
pool.on('error', err => console.error(err));  // don't let a pg restart kill your app

export default pool;
