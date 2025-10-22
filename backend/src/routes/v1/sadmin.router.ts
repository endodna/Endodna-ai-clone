import { Router } from 'express';
import { Authentication } from '../../middlewares/Authentication';
import { SAdminAuthorization } from '../../middlewares/Authorization';
import SAdminController from '../../controllers/SAdminController';
import { validate } from '../../middlewares/Validator';
import { createSuperAdminSchema, loginSchema, provisionOrganizationSchema } from '../../schemas';

const sAdminRouter = Router().use('/',
    Authentication,
    SAdminAuthorization
);

// Routes

// Super Admin routes
sAdminRouter.post('/admin', validate(createSuperAdminSchema), SAdminController.createSuperAdmin);

// Organization routes
sAdminRouter.post('/organization', validate(provisionOrganizationSchema), SAdminController.provisionOrganization);

export default sAdminRouter;
