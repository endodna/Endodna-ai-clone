import { Router } from 'express';
import AuthController from '../../controllers/AuthController';
import { validate } from '../../middlewares/Validator';
import { loginSchema } from '../../schemas';

const authRouter = Router();

// Routes
authRouter.post('/login', validate(loginSchema), AuthController.login);

export default authRouter;
