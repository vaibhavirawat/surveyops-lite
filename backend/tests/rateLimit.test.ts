import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLimiter } from '../src/middleware/rateLimit';

// A tiny app with a limit of 2 requests, so the limit is easy to reach.
function buildApp() {
  const app = express();
  app.use(createLimiter({ windowMs: 60_000, limit: 2, message: 'Slow down' }));
  app.get('/ping', (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('createLimiter', () => {
  it('allows requests up to the limit, then answers 429 in the standard error shape', async () => {
    const app = buildApp();
    expect((await request(app).get('/ping')).status).toBe(200);
    expect((await request(app).get('/ping')).status).toBe(200);

    const blocked = await request(app).get('/ping');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: { code: 'RATE_LIMITED', message: 'Slow down' } });
  });

  it('tells the client how much of the limit is left', async () => {
    const res = await request(buildApp()).get('/ping');
    expect(res.headers['ratelimit']).toBeDefined();
  });

  it('can be skipped, which is how the test suite switches it off', async () => {
    const app = express();
    app.use(createLimiter({ windowMs: 60_000, limit: 1, message: 'Slow down', skip: () => true }));
    app.get('/ping', (_req, res) => {
      res.json({ ok: true });
    });
    for (let i = 0; i < 5; i++) expect((await request(app).get('/ping')).status).toBe(200);
  });
});
