import { Router } from "express";
import PatientController from "../../controllers/PatientController";
import { Authentication } from "../../middlewares/Authentication";
import { PatientAuthorization } from "../../middlewares/Authorization";
import { validate } from "../../middlewares/Validator";
import { registerPatientDNAKitSchema } from "../../schemas";

const patientRouter = Router().use("/", Authentication, PatientAuthorization);

// Routes
patientRouter.get("/profile", PatientController.getProfile);
patientRouter.post(
    "/lab-orders/kit",
    validate(registerPatientDNAKitSchema),
    PatientController.registerPatientDNAKit,
);
export default patientRouter;
