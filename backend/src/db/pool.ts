import mysql from 'mysql2/promise';
import { env } from '../config/env';

// A pool keeps several open connections and lends one per query.
// Opening a new connection for every request would be slow.
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
});
