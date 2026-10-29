import type { Request, Response } from 'express';
import {
  changeStageBody,
  createVillageBody,
  idParams,
  listVillagesQuery,
  updateVillageBody,
} from './villages.schema';
import * as villagesService from './villages.service';

// A controller translates HTTP into function calls: read the request, call the service, send the response.
// Express 5 forwards errors from async functions to the error handler automatically,
// so a failed validation needs no try/catch here.

export async function listVillages(req: Request, res: Response) {
  const query = listVillagesQuery.parse(req.query); // throws ZodError (-> 400) if invalid
  res.json(await villagesService.listVillages(query));
}

export async function getVillage(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  res.json({ data: await villagesService.getVillage(id) });
}

export async function createVillage(req: Request, res: Response) {
  const body = createVillageBody.parse(req.body);
  const village = await villagesService.createVillage(body);
  res.status(201).location(`/api/villages/${village.id}`).json({ data: village });
}

export async function updateVillage(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  const body = updateVillageBody.parse(req.body);
  res.json({ data: await villagesService.updateVillage(id, body) });
}

export async function deleteVillage(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  await villagesService.deleteVillage(id);
  res.status(204).end(); // 204 = success, nothing to return
}

export async function changeStage(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  const body = changeStageBody.parse(req.body);
  res.json({ data: await villagesService.changeStage(id, body) });
}
