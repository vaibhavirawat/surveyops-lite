import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

// Express 5 passes startup errors (such as "port already in use") to this callback,
// so we must check for them instead of always logging success.
app.listen(env.PORT, (error?: Error) => {
  if (error) {
    logger.error(error, `Could not start on port ${env.PORT}`);
    process.exit(1);
  }
  logger.info(`API listening on http://localhost:${env.PORT}`);
});
