import { Router } from 'express';
import { rateLimiter } from '../../middlewares/RateLimiter';
import authRouter from './auth.router';
import patientRouter from './patient.router';
import adminRouter from './admin.router';
import miscRouter from './misc.router';
import sAdminRouter from './sadmin.router';
import doctorRouter from './doctor.router';


const v1Router = Router();

// Public routes
v1Router.use('/auth', rateLimiter.authentication_rate_limiter, authRouter);

// Protected routes
v1Router.use('/patient', patientRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/service', sAdminRouter);
v1Router.use('/misc', miscRouter);
v1Router.use('/doctor', doctorRouter);


export default v1Router;
