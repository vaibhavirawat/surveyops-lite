import type { PoolOptions } from 'mysql2/promise';
import { env } from '../config/env';

// Connection settings shared by the web server's pool and the migration script.
export const connectionOptions: PoolOptions = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  // Encrypt the connection and verify the server's certificate. Switch on with DB_SSL=true.
  ssl: env.DB_SSL ? { rejectUnauthorized: true } : undefined,
};
