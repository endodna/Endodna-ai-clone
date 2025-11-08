import { Router } from "express";
import AdminController from "../../controllers/AdminController";
import { Authentication } from "../../middlewares/Authentication";
import { AdminAuthorization } from "../../middlewares/Authorization";
import { validate } from "../../middlewares/Validator";
import { createAdminSchema, createDoctorSchema } from "../../schemas";

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

export default adminRouter;
