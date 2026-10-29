import { env } from '../config/env';
import { logger } from '../config/logger';
import { runMigrations } from './migrator';

// Command-line entry point: "npm run migrate"
runMigrations({ database: env.DB_NAME }).catch((error) => {
  logger.error(error, 'Migration failed');
  process.exit(1);
});
