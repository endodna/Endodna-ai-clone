import { Router } from "express";
import { Authentication } from "../../middlewares/Authentication";
import MiscController from "../../controllers/MiscController";
import { validateQuery } from "../../middlewares/Validator";
import { publicOrganizationInfoSchema } from "../../schemas";

const miscRouter = Router();

// Public routes (no authentication required)
miscRouter.get("/organization/public", validateQuery(publicOrganizationInfoSchema), MiscController.getPublicOrganizationInfo);

// Protected routes (require authentication)
miscRouter.use("/", Authentication);
miscRouter.get("/menu", MiscController.getMenu);
miscRouter.get("/constants", MiscController.getConstants);
miscRouter.get("/prefilled-patient-health-data-fields", MiscController.getPrefilledPatientHealthDataFields);

export default miscRouter;
