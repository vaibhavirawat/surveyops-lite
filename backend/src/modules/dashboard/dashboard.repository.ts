import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import type { Stage } from '../villages/villages.schema';

interface StageCountRow extends RowDataPacket {
  stage: Stage;
  count: number;
}

interface TehsilRow extends RowDataPacket {
  tehsil: string;
  total: number;
  completed: number;
}

// GROUP BY collapses many rows into one row per stage, and COUNT(*) counts the rows in each group.
// The database does the counting, so we never download every village just to count them.
export async function countByStage() {
  const [rows] = await pool.query<StageCountRow[]>(
    'SELECT stage, COUNT(*) AS count FROM villages GROUP BY stage',
  );
  return rows.map((row) => ({ stage: row.stage, count: Number(row.count) }));
}

// SUM(stage = 'tehsil_merged') adds up 1 for every row where the condition is true.
export async function countByTehsil() {
  const [rows] = await pool.query<TehsilRow[]>(
    `SELECT tehsil,
            COUNT(*) AS total,
            SUM(stage = 'tehsil_merged') AS completed
     FROM villages
     GROUP BY tehsil
     ORDER BY tehsil`,
  );
  return rows.map((row) => ({
    tehsil: row.tehsil,
    total: Number(row.total),
    completed: Number(row.completed),
  }));
}
