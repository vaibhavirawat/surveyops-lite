// Hosted MySQL services usually give you ONE connection string instead of separate settings:
//   mysql://user:password@host:3306/databasename
// This turns such a string into the separate DB_* variables the app uses.
// Variables that are set explicitly always win over values taken from the URL.
export function withDatabaseUrl(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const url = source.DATABASE_URL;
  if (!url) return source;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Deliberately do not print the value: it contains the password.
    throw new Error('DATABASE_URL is not a valid URL. Expected mysql://user:password@host:3306/database');
  }

  return {
    DB_HOST: parsed.hostname,
    DB_PORT: parsed.port || '3306',
    DB_USER: decodeURIComponent(parsed.username),
    DB_PASSWORD: decodeURIComponent(parsed.password),
    DB_NAME: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    ...source,
  };
}
