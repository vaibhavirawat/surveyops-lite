import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { parse as parseYaml } from 'yaml';
import { env } from './config/env';
import { pool } from './db/pool';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { villagesRouter } from './modules/villages/villages.routes';
import { errorHandler, notFound } from './middleware/errorHandler';

// Load the API description once at startup. It lives in backend/openapi.yaml.
const openApiSpec = parseYaml(fs.readFileSync(path.resolve(__dirname, '../openapi.yaml'), 'utf8'));

// Building the app in its own file (separate from server.ts) lets tests
// import it without actually opening a network port.
export const app = express();

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
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json()); // middleware: parses JSON request bodies

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

app.use('/api/dashboard', dashboardRouter);
app.use('/api/villages', villagesRouter);

// Order matters: these two must come after every route.
app.use(notFound);
app.use(errorHandler);
