import { Router } from "express";
import { rateLimiter } from "../../middlewares/RateLimiter";
import { TenantResolver } from "../../middlewares/TenantResolver";
import authRouter from "./auth.router";
import patientRouter from "./patient.router";
import adminRouter from "./admin.router";
import miscRouter from "./misc.router";
import sAdminRouter from "./sadmin.router";
import doctorRouter from "./doctor.router";
import licenseeRouter from "./licensee.router";

const v1Router = Router();

v1Router.use(TenantResolver);

// Public routes
v1Router.use("/auth", rateLimiter.authentication_rate_limiter, authRouter);

// Protected routes
v1Router.use("/patient", patientRouter);
v1Router.use("/admin", adminRouter);
v1Router.use("/service", sAdminRouter);
v1Router.use("/misc", miscRouter);
v1Router.use("/doctor", doctorRouter);
v1Router.use("/licensee", licenseeRouter);

export default v1Router;
