import { Router } from 'express';
import * as controller from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', controller.getStats);
