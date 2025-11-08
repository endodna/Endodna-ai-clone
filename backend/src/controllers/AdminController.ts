import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { Priority, UserType as PrismaUserType, Status } from "@prisma/client";
import { CreateAdminSchema, CreateDoctorSchema } from "../schemas";
import { UserService } from "../services/user.service";
import { logger } from "../helpers/logger.helper";

class AdminController {
  public static async createAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const { email, password, firstName, lastName, middleName } =
        req.body as CreateAdminSchema;

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        userType: PrismaUserType.ADMIN,
        organizationId: organizationId!,
        userId: userId,
        status: Status.PENDING,
        traceId: req.traceId,
      });

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Organization admin create attempt",
        metadata: {
          body: req.body,
        },
        priority: Priority.HIGH,
      });

      if (!result.success) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: result.error,
        });
      }

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...req.body,
          password: undefined,
        },
        message: "Organization admin created successfully",
      });
    } catch (err) {
      logger.error("Create admin failed", {
        traceId: req.traceId,
        method: "createAdmin",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create organization admin",
        },
        req,
      );
    }
  }

  public static async createDoctor(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const { email, password, firstName, lastName, middleName } =
        req.body as CreateDoctorSchema;

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        userType: PrismaUserType.DOCTOR,
        organizationId: organizationId!,
        userId: userId,
        status: Status.PENDING,
        traceId: req.traceId,
      });

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Organization doctor create attempt",
        metadata: {
          body: req.body,
        },
        priority: Priority.HIGH,
      });

      if (!result.success) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: result.error,
        });
      }

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...req.body,
          password: undefined,
        },
        message: "Organization doctor created successfully",
      });
    } catch (err) {
      logger.error("Create doctor failed", {
        traceId: req.traceId,
        method: "createDoctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create organization doctor",
        },
        req,
      );
    }
  }
}

export default AdminController;
