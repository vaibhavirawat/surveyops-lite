import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { pool } from '../src/db/pool';
import { countNotes, seedFixture } from './helpers';

// Integration tests: each test sends a real HTTP request through Express, validation,
// the service and SQL, into the test database. The fixture is reloaded before every test.
beforeEach(seedFixture);
afterAll(() => pool.end());

describe('GET /api/health', () => {
  it('reports the API and database as up', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });
});

describe('GET /api/villages', () => {
  it('returns a page of villages with pagination info', async () => {
    const res = await request(app).get('/api/villages?pageSize=4');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.meta).toEqual({ page: 1, pageSize: 4, total: 6, totalPages: 2 });
  });

  it('returns the remaining rows on the last page', async () => {
    const res = await request(app).get('/api/villages?pageSize=4&page=2&sort=code&order=asc');
    expect(res.body.data.map((v: any) => v.code)).toEqual(['VLG-0005', 'VLG-0006']);
  });

  it('searches by name, case-insensitively', async () => {
    const res = await request(app).get('/api/villages?search=ALPH');
    expect(res.body.data.map((v: any) => v.name)).toEqual(['Alpha']);
  });

  it('searches by code', async () => {
    const res = await request(app).get('/api/villages?search=VLG-0003');
    expect(res.body.data.map((v: any) => v.name)).toEqual(['Gamma']);
  });

  it('treats % in a search as plain text, not a wildcard', async () => {
    const res = await request(app).get('/api/villages?search=%25');
    expect(res.body.meta.total).toBe(0);
  });

  it('filters by stage and tehsil together', async () => {
    const res = await request(app).get('/api/villages?stage=tehsil_merged&tehsil=Tehsil%20Three');
    expect(res.body.data.map((v: any) => v.name)).toEqual(['Epsilon']);
  });

  it('filters by district', async () => {
    const res = await request(app).get('/api/villages?district=Y');
    expect(res.body.meta.total).toBe(3);
  });

  it('sorts by name descending', async () => {
    const res = await request(app).get('/api/villages?sort=name&order=desc&pageSize=2');
    expect(res.body.data.map((v: any) => v.name)).toEqual(['Zeta', 'Gamma']);
  });

  it('rejects an invalid stage, an oversized page and a bad sort column with 400', async () => {
    const stage = await request(app).get('/api/villages?stage=banana');
    const size = await request(app).get('/api/villages?pageSize=500');
    const sort = await request(app).get('/api/villages?sort=name;DROP%20TABLE%20villages');
    for (const res of [stage, size, sort]) {
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    const count = await request(app).get('/api/villages');
    expect(count.body.meta.total).toBe(6); // the table survived
  });

  it('treats a SQL injection attempt in search as plain text', async () => {
    const res = await request(app).get("/api/villages?search=' OR 1=1 --");
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });
});

describe('GET /api/villages/:id', () => {
  it('returns the village with its history', async () => {
    const res = await request(app).get('/api/villages/2');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 2, code: 'VLG-0002', stage: 'georeferenced' });
    expect(res.body.data.history).toHaveLength(1);
    expect(res.body.data.history[0]).toMatchObject({ fromStage: 'not_started', toStage: 'georeferenced' });
  });

  it('returns 404 for a missing village', async () => {
    const res = await request(app).get('/api/villages/9999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).get('/api/villages/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/villages', () => {
  it('creates a village, generates its code and starts it at not_started', async () => {
    const res = await request(app)
      .post('/api/villages')
      .send({ name: 'Newvillage', tehsil: 'Tehsil One', district: 'X', areaSqKm: 2.5 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ code: 'VLG-0007', name: 'Newvillage', stage: 'not_started', areaSqKm: 2.5 });
    expect(res.headers.location).toBe(`/api/villages/${res.body.data.id}`);
  });

  it('rejects a missing name and an unknown field', async () => {
    const missing = await request(app).post('/api/villages').send({ tehsil: 'T', district: 'D' });
    const extra = await request(app)
      .post('/api/villages')
      .send({ name: 'N', tehsil: 'T', district: 'D', stage: 'tehsil_merged' });
    expect(missing.status).toBe(400);
    expect(extra.status).toBe(400);
  });

  it('rejects a body that is not valid JSON', async () => {
    const res = await request(app).post('/api/villages').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('PATCH /api/villages/:id', () => {
  it('updates only the fields sent', async () => {
    const res = await request(app).patch('/api/villages/1').send({ name: 'Alpha Khas' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Alpha Khas', tehsil: 'Tehsil One', stage: 'not_started' });
  });

  it('refuses to change the stage through this endpoint', async () => {
    const res = await request(app).patch('/api/villages/1').send({ stage: 'tehsil_merged' });
    expect(res.status).toBe(400);
    const after = await request(app).get('/api/villages/1');
    expect(after.body.data.stage).toBe('not_started');
  });

  it('rejects an empty body', async () => {
    const res = await request(app).patch('/api/villages/1').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing village', async () => {
    const res = await request(app).patch('/api/villages/9999').send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/villages/:id/stage', () => {
  it('moves forward one stage and records a history entry', async () => {
    const res = await request(app).patch('/api/villages/1/stage').send({ toStage: 'georeferenced' });
    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe('georeferenced');

    const detail = await request(app).get('/api/villages/1');
    expect(detail.body.data.history).toHaveLength(1);
    expect(detail.body.data.history[0]).toMatchObject({ fromStage: 'not_started', toStage: 'georeferenced', note: null });
  });

  it('rejects skipping a stage and leaves the village and its history unchanged', async () => {
    const res = await request(app).patch('/api/villages/1/stage').send({ toStage: 'parcels_matched' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');

    const detail = await request(app).get('/api/villages/1');
    expect(detail.body.data.stage).toBe('not_started');
    expect(await countNotes(1)).toBe(0);
  });

  it('requires a note to move backwards', async () => {
    const res = await request(app).patch('/api/villages/3/stage').send({ toStage: 'georeferenced' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('NOTE_REQUIRED');
  });

  it('moves backwards when a note is given, and stores the note', async () => {
    const res = await request(app)
      .patch('/api/villages/3/stage')
      .send({ toStage: 'georeferenced', note: 'Parcels did not align with imagery' });
    expect(res.status).toBe(200);

    const detail = await request(app).get('/api/villages/3');
    expect(detail.body.data.stage).toBe('georeferenced');
    expect(detail.body.data.history[0]).toMatchObject({
      fromStage: 'parcels_matched',
      toStage: 'georeferenced',
      note: 'Parcels did not align with imagery',
    });
  });

  it('rejects moving to the stage it is already at', async () => {
    const res = await request(app).patch('/api/villages/2/stage').send({ toStage: 'georeferenced' });
    expect(res.status).toBe(422);
  });

  it('returns 400 for an unknown stage name and 404 for a missing village', async () => {
    const bad = await request(app).patch('/api/villages/1/stage').send({ toStage: 'banana' });
    const missing = await request(app).patch('/api/villages/9999/stage').send({ toStage: 'georeferenced' });
    expect(bad.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('lets only one of two simultaneous identical moves succeed (row lock)', async () => {
    const send = () => request(app).patch('/api/villages/1/stage').send({ toStage: 'georeferenced' });
    const [a, b] = await Promise.all([send(), send()]);

    expect([a.status, b.status].sort()).toEqual([200, 422]);
    expect(await countNotes(1)).toBe(1); // exactly one history entry, not two
  });
});

describe('DELETE /api/villages/:id', () => {
  it('deletes the village and its history', async () => {
    expect(await countNotes(2)).toBe(1);
    const res = await request(app).delete('/api/villages/2');
    expect(res.status).toBe(204);

    expect((await request(app).get('/api/villages/2')).status).toBe(404);
    expect(await countNotes(2)).toBe(0); // removed by ON DELETE CASCADE
  });

  it('returns 404 when the village does not exist', async () => {
    const res = await request(app).delete('/api/villages/9999');
    expect(res.status).toBe(404);
  });
});

describe('unknown routes', () => {
  it('return a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
