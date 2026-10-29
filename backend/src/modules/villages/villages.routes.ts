import { Router } from 'express';
import * as controller from './villages.controller';

// A router groups related URLs. It is mounted at /api/villages in app.ts.
export const villagesRouter = Router();

villagesRouter.get('/', controller.listVillages);
villagesRouter.post('/', controller.createVillage);
villagesRouter.get('/:id', controller.getVillage);
villagesRouter.patch('/:id', controller.updateVillage);
villagesRouter.delete('/:id', controller.deleteVillage);
villagesRouter.patch('/:id/stage', controller.changeStage);
