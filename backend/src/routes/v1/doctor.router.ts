import { Router } from 'express';
import AdminController from '../../controllers/AdminController';
import { Authentication } from '../../middlewares/Authentication';
import { DoctorAuthorization } from '../../middlewares/Authorization';
import { validate } from '../../middlewares/Validator';
import { createPatientSchema } from '../../schemas';

const doctorRouter = Router().use('/', Authentication, DoctorAuthorization);

// Routes
doctorRouter.post('/patient', validate(createPatientSchema), AdminController.createPatient);

export default doctorRouter;
