import 'dotenv/config';
import { z } from 'zod';
import { withDatabaseUrl } from './databaseUrl';

// Environment variables are always text. This turns "true" / "false" into a real boolean.
const flag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

// Zod describes what valid configuration looks like.
// If something is missing, the app fails immediately with a clear message
// instead of crashing mysteriously later.
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database. Either set DATABASE_URL, or the five DB_* values.
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_SSL: flag, // most hosted databases require an encrypted connection

  // Serving
  SERVE_FRONTEND: flag, // true in production: Express also serves the built React app
  TRUST_PROXY: z.coerce.number().int().min(0).default(0), // 1 when running behind one hosting proxy
  CORS_ORIGIN: z.string().optional(), // only needed if the frontend is hosted on a different address

  // Rate limiting (per IP address)
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(500),
  RATE_LIMIT_WRITE_MAX: z.coerce.number().int().positive().default(100),
});

export const env = schema.parse(withDatabaseUrl(process.env));
