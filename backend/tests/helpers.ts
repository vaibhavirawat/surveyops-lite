import { env } from '../src/config/env';
import { pool } from '../src/db/pool';

// Safety guard: these helpers delete data, so they refuse to run against any database
// other than the dedicated test one. This protects your development data.
function assertTestDatabase() {
  if (env.DB_NAME !== 'surveyops_test') {
    throw new Error(`Refusing to wipe "${env.DB_NAME}". Tests must run against surveyops_test.`);
  }
}

export async function resetDb() {
  assertTestDatabase();
  await pool.query('DELETE FROM stage_notes');
  await pool.query('DELETE FROM villages');
  await pool.query('ALTER TABLE villages AUTO_INCREMENT = 1'); // so ids start at 1 every time
}

// A small, known data set. Ids are 1 to 6 in this order, so tests can refer to them directly.
//   id  code      name     tehsil        district  stage
//   1   VLG-0001  Alpha    Tehsil One    X         not_started
//   2   VLG-0002  Beta     Tehsil One    X         georeferenced   (has one history note)
//   3   VLG-0003  Gamma    Tehsil Two    X         parcels_matched
//   4   VLG-0004  Delta    Tehsil Two    Y         tehsil_merged
//   5   VLG-0005  Epsilon  Tehsil Three  Y         tehsil_merged
//   6   VLG-0006  Zeta     Tehsil Three  Y         not_started
export async function seedFixture() {
  assertTestDatabase();
  await resetDb();
  await pool.query('INSERT INTO villages (code, name, tehsil, district, stage) VALUES ?', [
    [
      ['VLG-0001', 'Alpha', 'Tehsil One', 'X', 'not_started'],
      ['VLG-0002', 'Beta', 'Tehsil One', 'X', 'georeferenced'],
      ['VLG-0003', 'Gamma', 'Tehsil Two', 'X', 'parcels_matched'],
      ['VLG-0004', 'Delta', 'Tehsil Two', 'Y', 'tehsil_merged'],
      ['VLG-0005', 'Epsilon', 'Tehsil Three', 'Y', 'tehsil_merged'],
      ['VLG-0006', 'Zeta', 'Tehsil Three', 'Y', 'not_started'],
    ],
  ]);
  await pool.query('INSERT INTO stage_notes (village_id, from_stage, to_stage, note) VALUES (?, ?, ?, ?)', [
    2,
    'not_started',
    'georeferenced',
    null,
  ]);
}

export async function countNotes(villageId: number): Promise<number> {
  const [rows] = await pool.query<any[]>('SELECT COUNT(*) AS n FROM stage_notes WHERE village_id = ?', [villageId]);
  return Number(rows[0].n);
}
