import { Router } from 'express';
import AuthController from '../../controllers/AuthController';
import { validate } from '../../middlewares/Validator';
import { loginSchema } from '../../schemas';
import SAdminController from '../../controllers/SAdminController';
import { Authentication } from '../../middlewares/Authentication';

const authRouter = Router();

// Routes
authRouter.post('/login', validate(loginSchema), AuthController.login);
authRouter.post('/service/login', validate(loginSchema), SAdminController.login);
authRouter.post('/logout', Authentication, AuthController.signOut);
authRouter.get('/profile', Authentication, AuthController.getProfile);
authRouter.post('/set-password', Authentication, AuthController.setPassword);

export default authRouter;
