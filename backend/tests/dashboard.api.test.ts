import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { pool } from '../src/db/pool';
import { resetDb, seedFixture } from './helpers';

afterAll(() => pool.end());

describe('GET /api/dashboard/stats', () => {
  it('computes totals, stage counts and tehsil counts from the database', async () => {
    await seedFixture();
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);

    const { totals, byStage, byTehsil, recentlyUpdated } = res.body.data;
    expect(totals).toEqual({ villages: 6, notStarted: 2, inProgress: 2, completed: 2, completionPercent: 33.3 });
    expect(byStage).toEqual([
      { stage: 'not_started', count: 2 },
      { stage: 'georeferenced', count: 1 },
      { stage: 'parcels_matched', count: 1 },
      { stage: 'boundary_digitized', count: 0 },
      { stage: 'stored_in_geodatabase', count: 0 },
      { stage: 'tehsil_merged', count: 2 },
    ]);
    expect(byTehsil).toEqual([
      { tehsil: 'Tehsil One', total: 2, completed: 0 },
      { tehsil: 'Tehsil Three', total: 2, completed: 1 },
      { tehsil: 'Tehsil Two', total: 2, completed: 1 },
    ]);
    expect(recentlyUpdated).toHaveLength(5);
  });

  it('reflects a stage change immediately', async () => {
    await seedFixture();
    await request(app).patch('/api/villages/1/stage').send({ toStage: 'georeferenced' });
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.body.data.totals.notStarted).toBe(1);
    expect(res.body.data.byStage[1]).toEqual({ stage: 'georeferenced', count: 2 });
  });

  it('returns zeros, not errors, when there are no villages', async () => {
    await resetDb();
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({ villages: 0, notStarted: 0, inProgress: 0, completed: 0, completionPercent: 0 });
    expect(res.body.data.byStage).toHaveLength(6);
    expect(res.body.data.recentlyUpdated).toEqual([]);
  });
});
