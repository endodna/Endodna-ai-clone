import { Router } from 'express';
import { Authentication } from '../../middlewares/Authentication';
import { SAdminAuthorization } from '../../middlewares/Authorization';
import SAdminController from '../../controllers/SAdminController';
import { validate } from '../../middlewares/Validator';
import { createOrganizationAdminSchema, createSuperAdminSchema, loginSchema, provisionOrganizationSchema } from '../../schemas';

const sAdminRouter = Router().use('/',
    Authentication,
    SAdminAuthorization
);

// Routes

// Super Admin routes
sAdminRouter.post('/admin', validate(createSuperAdminSchema), SAdminController.createSuperAdmin);

// Organization routes
sAdminRouter.post('/organization', validate(provisionOrganizationSchema), SAdminController.provisionOrganization);
sAdminRouter.post('/organization/admin', validate(createOrganizationAdminSchema), SAdminController.createOrganizationAdmin);
sAdminRouter.get('/organization/list', SAdminController.getOrganizations);

export default sAdminRouter;
