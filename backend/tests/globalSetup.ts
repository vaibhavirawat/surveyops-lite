import { runMigrations } from '../src/db/migrator';

// Makes sure the test database has the latest schema before any test runs.
export default async function setup() {
  await runMigrations({ database: 'surveyops_test' });
}
