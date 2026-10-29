import { describe, expect, it } from 'vitest';
import { withDatabaseUrl } from '../src/config/databaseUrl';

describe('withDatabaseUrl', () => {
  it('returns the environment unchanged when there is no DATABASE_URL', () => {
    const source = { DB_HOST: 'localhost' };
    expect(withDatabaseUrl(source)).toBe(source);
  });

  it('splits a connection string into the separate DB_* values', () => {
    const result = withDatabaseUrl({ DATABASE_URL: 'mysql://app_user:s3cret@db.example.com:3307/surveyops' });
    expect(result).toMatchObject({
      DB_HOST: 'db.example.com',
      DB_PORT: '3307',
      DB_USER: 'app_user',
      DB_PASSWORD: 's3cret',
      DB_NAME: 'surveyops',
    });
  });

  it('uses port 3306 when the URL has no port', () => {
    expect(withDatabaseUrl({ DATABASE_URL: 'mysql://u:p@host/db' }).DB_PORT).toBe('3306');
  });

  it('decodes special characters in the password', () => {
    const result = withDatabaseUrl({ DATABASE_URL: 'mysql://u:p%40ss%2Fword@host/db' });
    expect(result.DB_PASSWORD).toBe('p@ss/word');
  });

  it('lets explicitly set variables win over the URL', () => {
    const result = withDatabaseUrl({ DATABASE_URL: 'mysql://u:p@host/prod_db', DB_NAME: 'surveyops_test' });
    expect(result.DB_NAME).toBe('surveyops_test');
    expect(result.DB_HOST).toBe('host');
  });

  it('rejects an invalid URL without printing the secret', () => {
    const attempt = () => withDatabaseUrl({ DATABASE_URL: 'not a url with password hunter2' });
    expect(attempt).toThrowError(/not a valid URL/);
    expect(attempt).not.toThrowError(/hunter2/);
  });
});
