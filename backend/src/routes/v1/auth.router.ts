import { Router } from "express";
import AuthController from "../../controllers/AuthController";
import { validate } from "../../middlewares/Validator";
import {
  exchangeTransferCodeSchema,
  forgotPasswordSchema,
  loginSchema,
  setPasswordSchema,
  validateLoginSchema,
} from "../../schemas";
import SAdminController from "../../controllers/SAdminController";
import { Authentication } from "../../middlewares/Authentication";
import { rateLimiter } from "../../middlewares/RateLimiter";

const authRouter = Router();

// Routes
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post(
  "/login/token",
  validate(validateLoginSchema),
  AuthController.validateLogin,
);
authRouter.post(
  "/service/login",
  validate(loginSchema),
  SAdminController.login,
);
authRouter.post("/logout", Authentication, AuthController.signOut);
authRouter.get("/profile", Authentication, AuthController.getProfile);
authRouter.get("/organization", Authentication, AuthController.getOrganization);
authRouter.get("/all-roles", Authentication, AuthController.getRoles);
authRouter.post("/transfer-code",
  rateLimiter.transfer_code_rate_limiter,
  Authentication,
  AuthController.createTransferCode);
authRouter.post("/exchange-transfer-code",
  validate(exchangeTransferCodeSchema),
  AuthController.exchangeTransferCode);
authRouter.post(
  "/set-password",
  validate(setPasswordSchema),
  AuthController.setPassword,
);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);
export default authRouter;
