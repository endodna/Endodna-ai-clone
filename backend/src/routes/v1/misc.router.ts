import { Router } from 'express';
import { Authentication } from '../../middlewares/Authentication';
import MiscController from '../../controllers/MiscController';

const miscRouter = Router().use('/', Authentication);

// Routes
miscRouter.get('/menu', MiscController.getMenu);

export default miscRouter;
