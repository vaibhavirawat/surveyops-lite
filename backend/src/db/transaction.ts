import type { PoolConnection } from 'mysql2/promise';
import { pool } from './pool';

// A transaction groups several SQL statements into one all-or-nothing unit.
// All statements must use the SAME connection, so we borrow one from the pool,
// run the work on it, then COMMIT (keep everything) or ROLLBACK (undo everything).
export async function withTransaction<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release(); // always hand the connection back to the pool
  }
}
