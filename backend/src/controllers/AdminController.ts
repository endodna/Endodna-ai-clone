import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { Priority, UserType as PrismaUserType } from "@prisma/client";
import {
  CreateAdminSchema,
  CreateDoctorSchema,
  CreatePatientSchema,
} from "../schemas";
import { UserService } from "../services/user.service";

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
    } catch (_err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: "Failed to create organization admin",
      });
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
    } catch (_err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: "Failed to create organization doctor",
      });
    }
  }

  public static async createPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const { email, password, firstName, lastName, middleName } =
        req.body as CreatePatientSchema;

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        userType: PrismaUserType.PATIENT,
        organizationId: organizationId!,
      });

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Organization patient create attempt",
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
        message: "Organization patient created successfully",
      });
    } catch (_err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: "Failed to create organization patient",
      });
    }
  }
}

export default AdminController;
