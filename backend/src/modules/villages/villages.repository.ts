import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../db/pool';
import type { ListVillagesQuery, Stage } from './villages.schema';

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

type VillageRow = Village & RowDataPacket;

// Placeholders (?) can hold values but NOT column names, so ORDER BY needs a whitelist.
// Only these fixed strings can ever reach the SQL text.
const SORT_COLUMNS = {
  name: 'name',
  code: 'code',
  stage: 'stage',
  updated_at: 'updated_at',
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
      `SELECT id, code, name, tehsil, district,
              area_sq_km AS areaSqKm, stage,
              created_at AS createdAt, updated_at AS updatedAt
       FROM villages ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    ),
    pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM villages ${where}`, params),
  ]);

  return { rows, total: Number(countRows[0].total) };
}
