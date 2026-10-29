import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool } from './db/pool';

// Express 5 passes startup errors (such as "port already in use") to this callback,
// so we must check for them instead of always logging success.
const server = app.listen(env.PORT, (error?: Error) => {
  if (error) {
    logger.error(error, `Could not start on port ${env.PORT}`);
    process.exit(1);
  }
  logger.info(`API listening on http://localhost:${env.PORT}`);
});

// Hosting platforms send SIGTERM when they replace or stop the app. Stop taking new requests,
// let running ones finish, close the database connections, then exit. The timer is a safety net.
function shutDown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutDown('SIGTERM'));
process.on('SIGINT', () => shutDown('SIGINT'));
