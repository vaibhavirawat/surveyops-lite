import fs from 'node:fs/promises';
import path from 'node:path';
import mysql, { RowDataPacket } from 'mysql2/promise';
import { logger } from '../config/logger';
import { connectionOptions } from './options';

// Applies every .sql file in /migrations that has not been applied yet, in filename order.
// The table "schema_migrations" remembers which files already ran, so running this twice is safe.
// The target database is a parameter so the test suite can migrate its own separate database.
export async function runMigrations(options: { database: string }) {
  // multipleStatements lets one .sql file contain several CREATE TABLE statements.
  // It is only enabled for migrations, never for the web server's pool.
  const conn = await mysql.createConnection({
    ...connectionOptions,
    database: options.database,
    multipleStatements: true,
  });

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await conn.query<RowDataPacket[]>('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name as string));

    const dir = path.resolve(__dirname, '../../migrations');
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) {
        logger.info(`skip   ${file} (already applied)`);
        continue;
      }
      const sql = await fs.readFile(path.join(dir, file), 'utf8');
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      logger.info(`apply  ${file}`);
    }
  } finally {
    await conn.end();
  }
}
