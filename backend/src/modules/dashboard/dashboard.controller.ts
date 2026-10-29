import type { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';

export async function getStats(_req: Request, res: Response) {
  res.json({ data: await dashboardService.getStats() });
}
