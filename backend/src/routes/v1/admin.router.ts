import { Router } from 'express';
import AdminController from '../../controllers/AdminController';
import { Authentication } from '../../middlewares/Authentication';
import { AdminAuthorization } from '../../middlewares/Authorization';

const adminRouter = Router().use('/', Authentication, AdminAuthorization);

// Routes
// adminRouter.get('/dashboard', AdminController.getDashboard);

export default adminRouter;
