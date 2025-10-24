import { Router } from "express";
import PatientController from "../../controllers/PatientController";
import { Authentication } from "../../middlewares/Authentication";
import { PatientAuthorization } from "../../middlewares/Authorization";

const patientRouter = Router().use("/", Authentication, PatientAuthorization);

// Routes
patientRouter.get("/profile", PatientController.getProfile);

export default patientRouter;
