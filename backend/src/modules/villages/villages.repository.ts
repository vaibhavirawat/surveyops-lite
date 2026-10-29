import { randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import type { CreateVillageBody, ListVillagesQuery, Stage, UpdateVillageBody } from './villages.schema';

// Every function takes an optional "db". By default it uses the shared pool,
// but a transaction passes in its own connection so all steps run together.
type Db = Pool | PoolConnection;

// A TypeScript interface describes the shape of an object. Here: one village as the API returns it.
export interface Village {
  id: number;
  code: string;
  name: string;
  tehsil: string;
  district: string;
  areaSqKm: number | null;
  stage: Stage;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageNote {
  id: number;
  fromStage: Stage;
  toStage: Stage;
  note: string | null;
  createdAt: Date;
}

type VillageRow = Village & RowDataPacket;
type StageNoteRow = StageNote & RowDataPacket;

// "AS" renames snake_case database columns to the camelCase names the API uses.
const VILLAGE_COLUMNS = `id, code, name, tehsil, district,
  area_sq_km AS areaSqKm, stage,
  created_at AS createdAt, updated_at AS updatedAt`;

// Placeholders (?) can hold values but NOT column names, so ORDER BY needs a whitelist.
// Only these fixed strings can ever reach the SQL text.
const SORT_COLUMNS = {
  name: 'name',
  code: 'code',
  stage: 'stage',
  updated_at: 'updated_at',
} as const;

// The same idea for UPDATE: only these fields may be written, mapped to their real column names.
const UPDATABLE_COLUMNS = {
  name: 'name',
  tehsil: 'tehsil',
  district: 'district',
  areaSqKm: 'area_sq_km',
} as const;

// In a LIKE pattern, % and _ are wildcards. Escape them so a search for "50%" means a literal "50%".
function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, '\\$&');
}

export async function findVillages(query: ListVillagesQuery) {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (query.search) {
    const pattern = `%${escapeLike(query.search)}%`;
    conditions.push('(name LIKE ? OR code LIKE ?)');
    params.push(pattern, pattern);
  }
  if (query.tehsil) {
    conditions.push('tehsil = ?');
    params.push(query.tehsil);
  }
  if (query.district) {
    conditions.push('district = ?');
    params.push(query.district);
  }
  if (query.stage) {
    conditions.push('stage = ?');
    params.push(query.stage);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  // "id" is a tie-breaker so pages never repeat or skip rows when many rows share the same sort value.
  const orderBy = `ORDER BY ${SORT_COLUMNS[query.sort]} ${query.order === 'asc' ? 'ASC' : 'DESC'}, id ASC`;
  const offset = (query.page - 1) * query.pageSize;

  // The page of rows and the total count are independent, so run both queries at the same time.
  const [[rows], [countRows]] = await Promise.all([
    pool.query<VillageRow[]>(
      `SELECT ${VILLAGE_COLUMNS} FROM villages ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    ),
    pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM villages ${where}`, params),
  ]);

  return { rows, total: Number(countRows[0].total) };
}

// The distinct tehsil and district names that exist, used to fill filter dropdowns in the UI.
export async function findFilterOptions() {
  const [[tehsils], [districts]] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT DISTINCT tehsil FROM villages ORDER BY tehsil'),
    pool.query<RowDataPacket[]>('SELECT DISTINCT district FROM villages ORDER BY district'),
  ]);
  return {
    tehsils: tehsils.map((row) => row.tehsil as string),
    districts: districts.map((row) => row.district as string),
  };
}

export async function findById(id: number, db: Db = pool): Promise<Village | null> {
  const [rows] = await db.query<VillageRow[]>(`SELECT ${VILLAGE_COLUMNS} FROM villages WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

// FOR UPDATE locks this row until the transaction ends. A second request trying to
// change the same village must wait, then sees the NEW stage instead of the old one.
export async function findByIdForUpdate(id: number, db: PoolConnection): Promise<Village | null> {
  const [rows] = await db.query<VillageRow[]>(
    `SELECT ${VILLAGE_COLUMNS} FROM villages WHERE id = ? FOR UPDATE`,
    [id],
  );
  return rows[0] ?? null;
}

export async function findHistory(villageId: number, db: Db = pool): Promise<StageNote[]> {
  const [rows] = await db.query<StageNoteRow[]>(
    `SELECT id, from_stage AS fromStage, to_stage AS toStage, note, created_at AS createdAt
     FROM stage_notes WHERE village_id = ? ORDER BY id DESC`,
    [villageId],
  );
  return rows;
}

// Inserts the village with a temporary code, then sets the real code (VLG-0023) from the new id.
// Both statements must be in the same transaction so a temporary code is never left behind.
export async function insertVillage(data: CreateVillageBody, db: PoolConnection): Promise<number> {
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO villages (code, name, tehsil, district, area_sq_km) VALUES (?, ?, ?, ?, ?)',
    [`TMP-${randomUUID().slice(0, 15)}`, data.name, data.tehsil, data.district, data.areaSqKm ?? null],
  );
  await db.query("UPDATE villages SET code = CONCAT('VLG-', LPAD(id, 4, '0')) WHERE id = ?", [result.insertId]);
  return result.insertId;
}

export async function updateVillage(id: number, data: UpdateVillageBody, db: Db = pool): Promise<void> {
  const assignments: string[] = [];
  const params: (string | number | null)[] = [];

  for (const [field, column] of Object.entries(UPDATABLE_COLUMNS)) {
    const value = data[field as keyof typeof UPDATABLE_COLUMNS];
    if (value !== undefined) {
      assignments.push(`${column} = ?`);
      params.push(value);
    }
  }
  if (assignments.length === 0) return;

  await db.query(`UPDATE villages SET ${assignments.join(', ')} WHERE id = ?`, [...params, id]);
}

export async function updateStage(id: number, stage: Stage, db: PoolConnection): Promise<void> {
  await db.query('UPDATE villages SET stage = ? WHERE id = ?', [stage, id]);
}

export async function insertStageNote(
  note: { villageId: number; fromStage: Stage; toStage: Stage; note: string | null },
  db: PoolConnection,
): Promise<void> {
  await db.query('INSERT INTO stage_notes (village_id, from_stage, to_stage, note) VALUES (?, ?, ?, ?)', [
    note.villageId,
    note.fromStage,
    note.toStage,
    note.note,
  ]);
}

// Returns how many rows were deleted (0 means the id did not exist).
export async function deleteVillage(id: number, db: Db = pool): Promise<number> {
  const [result] = await db.query<ResultSetHeader>('DELETE FROM villages WHERE id = ?', [id]);
  return result.affectedRows;
}
