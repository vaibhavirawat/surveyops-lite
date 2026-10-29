import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pool } from './db/pool';

// Building the app in its own file (separate from server.ts) lets tests
// import it without actually opening a network port.
export const app = express();

app.use(helmet()); // middleware: adds security headers
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
