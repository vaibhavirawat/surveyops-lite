import { findVillages } from './villages.repository';
import type { ListVillagesQuery } from './villages.schema';

// The service layer holds business logic. For now it only shapes the pagination info;
// in Milestone 4 the stage-move rules will live here.
export async function listVillages(query: ListVillagesQuery) {
  const { rows, total } = await findVillages(query);
  return {
    data: rows,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}
