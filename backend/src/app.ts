import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool } from './db/pool';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { villagesRouter } from './modules/villages/villages.routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { createLimiter } from './middleware/rateLimit';

// Load the API description once at startup. It lives in backend/openapi.yaml.
const openApiSpec = parseYaml(fs.readFileSync(path.resolve(__dirname, '../openapi.yaml'), 'utf8'));

// Where the built React app lives (made by "npm run build" in /frontend).
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

// Building the app in its own file (separate from server.ts) lets tests
// import it without actually opening a network port.
export const app = express();

// Hosting platforms put a proxy in front of the app. Without this, every visitor would look like the
// proxy's IP address, and rate limiting would treat all visitors as one person.
app.set('trust proxy', env.TRUST_PROXY);

app.use(
  helmet({
    // By default helmet tells browsers to upgrade every request to https. On plain http://localhost
    // that breaks the Swagger page (especially in Safari), so it is switched off outside production.
    contentSecurityPolicy:
      env.NODE_ENV === 'production'
        ? undefined
        : { useDefaults: true, directives: { upgradeInsecureRequests: null } },
  }),
); // middleware: adds security headers

// Cross-origin requests are only needed if the frontend is hosted at a different address.
// In development Vite's proxy, and in production Express itself, serve both from one address.
if (env.CORS_ORIGIN) app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// One structured JSON log line per request (method, URL, status, duration). Health checks are skipped as noise.
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/api/health' },
    customLogLevel: (_req, res, error) => (error || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
  }),
);

app.use(express.json({ limit: '100kb' })); // middleware: parses JSON request bodies

// Mounted before the rate limiters: monitoring pings and the docs page should never be blocked.
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// Interactive API documentation, plus the raw OpenAPI document for tools.
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'SurveyOps Lite API' }));
app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

// Two limits: a generous one for all API calls, and a stricter one for requests that change data.
// The numbers are sensible starting points, not tuned from measurements; adjust them with environment variables.
const skipInTests = () => env.NODE_ENV === 'test';
const windowMs = env.RATE_LIMIT_WINDOW_MINUTES * 60_000;
const apiLimiter = createLimiter({
  windowMs,
  limit: env.RATE_LIMIT_API_MAX,
  message: 'Too many requests. Please slow down and try again shortly.',
  skip: skipInTests,
});
const writeLimiter = createLimiter({
  windowMs,
  limit: env.RATE_LIMIT_WRITE_MAX,
  message: 'Too many changes in a short time. Please try again later.',
  skip: skipInTests,
});
const CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

app.use('/api', apiLimiter);
app.use('/api', (req, res, next) => (CHANGING_METHODS.has(req.method) ? writeLimiter(req, res, next) : next()));

app.use('/api/dashboard', dashboardRouter);
app.use('/api/villages', villagesRouter);

// An unknown /api/... address must be a JSON 404, so this comes before the frontend fallback below.
app.use('/api', notFound);

// In production, Express also serves the built React app, so the whole project is ONE service at ONE address.
if (env.SERVE_FRONTEND) {
  const indexFile = path.join(frontendDist, 'index.html');
  if (!fs.existsSync(indexFile)) {
    throw new Error(`SERVE_FRONTEND is on, but ${indexFile} does not exist. Run "npm run build" in /frontend first.`);
  }
  app.use(
    express.static(frontendDist, {
      index: false,
      setHeaders: (res, filePath) => {
        // Vite puts a content hash in every file name under /assets, so those files can be cached "forever".
        if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );
  // Single-page-app fallback: /villages is a React route, not a file, so every other address returns index.html.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });
}

// Order matters: these two must come after every route.
app.use(notFound);
app.use(errorHandler);
