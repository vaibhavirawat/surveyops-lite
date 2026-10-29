import { withTransaction } from '../../db/transaction';
import { AppError } from '../../utils/AppError';
import * as repo from './villages.repository';
import { STAGES } from './villages.schema';
import type { ChangeStageBody, CreateVillageBody, ListVillagesQuery, Stage, UpdateVillageBody } from './villages.schema';

// The service layer holds business logic: rules about what is allowed, and which steps must happen together.

// The workflow rules, kept as a plain function so they are easy to unit test later:
//   - a village moves forward exactly one stage at a time
//   - moving backwards (rework) is allowed, but a note explaining why is required
//   - staying on the same stage is not a move
export function assertValidTransition(from: Stage, to: Stage, note?: string) {
  const difference = STAGES.indexOf(to) - STAGES.indexOf(from);

  if (difference === 0) {
    throw new AppError(422, 'INVALID_TRANSITION', `Village is already at stage "${from}"`);
  }
  if (difference > 1) {
    const next = STAGES[STAGES.indexOf(from) + 1];
    throw new AppError(422, 'INVALID_TRANSITION', `Cannot skip from "${from}" to "${to}". The next stage is "${next}"`);
  }
  if (difference < 0 && !note) {
    throw new AppError(422, 'NOTE_REQUIRED', 'A note explaining the rework is required when moving a village backwards');
  }
}

export async function listVillages(query: ListVillagesQuery) {
  const { rows, total } = await repo.findVillages(query);
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

export function getFilterOptions() {
  return repo.findFilterOptions();
}

export async function getVillage(id: number) {
  const village = await repo.findById(id);
  if (!village) throw new AppError(404, 'NOT_FOUND', `Village ${id} not found`);
  const history = await repo.findHistory(id);
  return { ...village, history };
}

export async function createVillage(body: CreateVillageBody) {
  return withTransaction(async (conn) => {
    const id = await repo.insertVillage(body, conn);
    return (await repo.findById(id, conn))!;
  });
}

export async function updateVillage(id: number, body: UpdateVillageBody) {
  if (!(await repo.findById(id))) throw new AppError(404, 'NOT_FOUND', `Village ${id} not found`);
  await repo.updateVillage(id, body);
  return (await repo.findById(id))!;
}

export async function deleteVillage(id: number) {
  const deleted = await repo.deleteVillage(id);
  if (deleted === 0) throw new AppError(404, 'NOT_FOUND', `Village ${id} not found`);
}

// Moving a village changes TWO tables: villages.stage and a new stage_notes row.
// If the second step failed after the first, the history would be wrong, so both run in one transaction.
export async function changeStage(id: number, body: ChangeStageBody) {
  return withTransaction(async (conn) => {
    const village = await repo.findByIdForUpdate(id, conn); // lock the row
    if (!village) throw new AppError(404, 'NOT_FOUND', `Village ${id} not found`);

    assertValidTransition(village.stage, body.toStage, body.note);

    await repo.updateStage(id, body.toStage, conn);
    await repo.insertStageNote(
      { villageId: id, fromStage: village.stage, toStage: body.toStage, note: body.note ?? null },
      conn,
    );
    return (await repo.findById(id, conn))!;
  });
}
