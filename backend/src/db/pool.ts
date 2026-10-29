import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { connectionOptions } from './options';

// A pool keeps several open connections and lends one per query.
// Opening a new connection for every request would be slow.
export const pool = mysql.createPool({
  ...connectionOptions,
  database: env.DB_NAME,
  connectionLimit: 10,
  decimalNumbers: true, // return DECIMAL columns as numbers instead of strings
});
