import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // These variables apply inside the tests. dotenv never overrides a variable that is already set,
    // so DB_NAME here beats the value in .env and the tests use the separate test database.
    env: { NODE_ENV: 'test', DB_NAME: 'surveyops_test' },
    globalSetup: ['tests/globalSetup.ts'], // runs once before all tests
    fileParallelism: false, // test files share one database, so run them one after another
    hookTimeout: 20_000,
  },
});
