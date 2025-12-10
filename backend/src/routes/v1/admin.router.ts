import { Router } from "express";
import AdminController from "../../controllers/AdminController";
import { Authentication } from "../../middlewares/Authentication";
import { AdminAuthorization } from "../../middlewares/Authorization";
import { validate } from "../../middlewares/Validator";
import { createAdminSchema, createDoctorSchema, updateOrganizationCustomizationSchema, updateOrganizationNameSchema, deletePatientSchema } from "../../schemas";
import { uploadSingle } from "../../middlewares/FileUpload";

const adminRouter = Router().use("/", Authentication, AdminAuthorization);

// Routes
adminRouter.post(
  "/doctor",
  validate(createDoctorSchema),
  AdminController.createDoctor,
);
adminRouter.post(
  "/admin",
  validate(createAdminSchema),
  AdminController.createAdmin,
);
adminRouter.delete(
  "/patient",
  validate(deletePatientSchema),
  AdminController.deleteOrganizationPatients,
);

// Organization routes
adminRouter.put(
  "/organization",
  validate(updateOrganizationNameSchema),
  AdminController.updateOrganization,
);

// Organization customization routes
adminRouter.put(
  "/organization/customization",
  uploadSingle,
  validate(updateOrganizationCustomizationSchema),
  AdminController.updateOrganizationCustomization,
);

export default adminRouter;
