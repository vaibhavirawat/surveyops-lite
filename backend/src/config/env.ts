import 'dotenv/config';
import { z } from 'zod';

// Zod describes what valid configuration looks like.
// If something is missing, the app fails immediately with a clear message
// instead of crashing mysteriously later.
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
});

export const env = schema.parse(process.env);
