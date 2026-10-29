import { pool } from './pool';
import { logger } from '../config/logger';

// All names below are FICTIONAL sample data. They do not describe real villages or records.

const STAGES = [
  'not_started',
  'georeferenced',
  'parcels_matched',
  'boundary_digitized',
  'stored_in_geodatabase',
  'tehsil_merged',
] as const;

type Stage = (typeof STAGES)[number];

interface SeedVillage {
  name: string;
  tehsil: string;
  district: string;
  area: number;
  stage: Stage;
  daysAgo: number; // how long ago it was last updated
}

const villages: SeedVillage[] = [
  { name: 'Amrakhal', tehsil: 'Tehsil Sarnauli', district: 'Himora', area: 4.2, stage: 'tehsil_merged', daysAgo: 21 },
  { name: 'Bansdhar', tehsil: 'Tehsil Sarnauli', district: 'Himora', area: 3.1, stage: 'tehsil_merged', daysAgo: 18 },
  { name: 'Chirauli', tehsil: 'Tehsil Sarnauli', district: 'Himora', area: 5.6, stage: 'stored_in_geodatabase', daysAgo: 9 },
  { name: 'Dhanaulta', tehsil: 'Tehsil Sarnauli', district: 'Himora', area: 2.8, stage: 'stored_in_geodatabase', daysAgo: 6 },
  { name: 'Ekdhara', tehsil: 'Tehsil Sarnauli', district: 'Himora', area: 6.4, stage: 'boundary_digitized', daysAgo: 4 },
  { name: 'Falgunkhet', tehsil: 'Tehsil Sarnauli', district: 'Himora', area: 3.9, stage: 'parcels_matched', daysAgo: 3 },
  { name: 'Gadhera', tehsil: 'Tehsil Pindwari', district: 'Himora', area: 4.7, stage: 'georeferenced', daysAgo: 2 },
  { name: 'Hariyali', tehsil: 'Tehsil Pindwari', district: 'Himora', area: 5.0, stage: 'not_started', daysAgo: 1 },
  { name: 'Indrawan', tehsil: 'Tehsil Pindwari', district: 'Himora', area: 3.3, stage: 'boundary_digitized', daysAgo: 5 },
  { name: 'Jakhola', tehsil: 'Tehsil Pindwari', district: 'Himora', area: 2.5, stage: 'parcels_matched', daysAgo: 7 },
  { name: 'Kaldhar', tehsil: 'Tehsil Pindwari', district: 'Himora', area: 7.1, stage: 'georeferenced', daysAgo: 8 },
  { name: 'Lohargaon', tehsil: 'Tehsil Pindwari', district: 'Himora', area: 4.0, stage: 'not_started', daysAgo: 10 },
  { name: 'Maldeo', tehsil: 'Tehsil Ranigad', district: 'Kedarwal', area: 3.6, stage: 'tehsil_merged', daysAgo: 30 },
  { name: 'Naudhar', tehsil: 'Tehsil Ranigad', district: 'Kedarwal', area: 5.2, stage: 'stored_in_geodatabase', daysAgo: 12 },
  { name: 'Oakhal', tehsil: 'Tehsil Ranigad', district: 'Kedarwal', area: 2.9, stage: 'boundary_digitized', daysAgo: 11 },
  { name: 'Pipalgaon', tehsil: 'Tehsil Ranigad', district: 'Kedarwal', area: 6.0, stage: 'parcels_matched', daysAgo: 13 },
  { name: 'Quilkhet', tehsil: 'Tehsil Ranigad', district: 'Kedarwal', area: 3.4, stage: 'georeferenced', daysAgo: 14 },
  { name: 'Rampuri Khas', tehsil: 'Tehsil Ranigad', district: 'Kedarwal', area: 4.8, stage: 'not_started', daysAgo: 15 },
  { name: 'Sundarkhal', tehsil: 'Tehsil Tarapani', district: 'Kedarwal', area: 5.5, stage: 'parcels_matched', daysAgo: 16 },
  { name: 'Tilwara', tehsil: 'Tehsil Tarapani', district: 'Kedarwal', area: 2.7, stage: 'boundary_digitized', daysAgo: 17 },
  { name: 'Udaypur Malla', tehsil: 'Tehsil Tarapani', district: 'Kedarwal', area: 4.4, stage: 'georeferenced', daysAgo: 19 },
  { name: 'Vishnugad', tehsil: 'Tehsil Tarapani', district: 'Kedarwal', area: 6.8, stage: 'not_started', daysAgo: 20 },
];

async function main() {
  // A transaction groups many statements into one all-or-nothing unit:
  // if any insert fails, ROLLBACK undoes everything, so the table is never half-seeded.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Delete old rows so running the seed twice does not create duplicates.
    await conn.query('DELETE FROM stage_notes');
    await conn.query('DELETE FROM villages');
    await conn.query('ALTER TABLE villages AUTO_INCREMENT = 1');

    for (const [index, v] of villages.entries()) {
      const code = `VLG-${String(index + 1).padStart(4, '0')}`;

      // The "?" placeholders are filled in separately from the SQL text,
      // so the values can never be interpreted as SQL (this is what stops SQL injection).
      const [result] = await conn.query(
        `INSERT INTO villages (code, name, tehsil, district, area_sq_km, stage, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [code, v.name, v.tehsil, v.district, v.area, v.stage, v.daysAgo + 30, v.daysAgo],
      );
      const villageId = (result as { insertId: number }).insertId;

      // One history row per step the village has already passed through.
      const reached = STAGES.indexOf(v.stage);
      for (let i = 1; i <= reached; i++) {
        await conn.query(
          `INSERT INTO stage_notes (village_id, from_stage, to_stage, note, created_at)
           VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [villageId, STAGES[i - 1], STAGES[i], null, v.daysAgo + (reached - i) + 1],
        );
      }
    }

    await conn.commit();
    logger.info(`Seeded ${villages.length} villages`);
  } catch (error) {
    await conn.rollback();
    logger.error(error, 'Seeding failed, rolled back');
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
