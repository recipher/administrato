import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });
pool.on('error', err => console.error(err));  // don't let a pg restart kill your app

export default pool;
