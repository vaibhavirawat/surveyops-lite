import type { Request, Response } from 'express';
import { listVillagesQuery } from './villages.schema';
import * as villagesService from './villages.service';

// A controller translates HTTP into function calls: read the request, call the service, send the response.
// Express 5 forwards errors from async functions to the error handler automatically,
// so a failed validation needs no try/catch here.
export async function listVillages(req: Request, res: Response) {
  const query = listVillagesQuery.parse(req.query); // throws ZodError (-> 400) if invalid
  const result = await villagesService.listVillages(query);
  res.json(result);
}
