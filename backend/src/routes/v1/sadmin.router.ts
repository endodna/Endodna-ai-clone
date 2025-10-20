import { Router } from 'express';
import { Authentication } from '../../middlewares/Authentication';
import { SAdminAuthorization } from '../../middlewares/Authorization';

const sAdminRouter = Router().use('/', Authentication, SAdminAuthorization);

// Routes


export default sAdminRouter;
