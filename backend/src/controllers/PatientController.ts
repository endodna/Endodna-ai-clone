import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { logger } from "../helpers/logger.helper";
import { UserService } from "../services/user.service";
import { RegisterPatientDNAKitSchema } from "../schemas";
import { Priority } from "@prisma/client";

class PatientController {
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { user: _user } = req;

      sendResponse(res, {
        status: StatusCode.OK,
        data: {},
        message: "Profile fetched successfully",
      });
    } catch (err) {
      logger.error("Get profile failed", {
        traceId: req.traceId,
        method: "getProfile",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch profile",
        },
        req,
      );
    }
  }

  public static async registerPatientDNAKit(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { userId, organizationId } = req.user!;
      const { barcode } = req.body as RegisterPatientDNAKitSchema;

      const result = await UserService.registerPatientDNAKit({
        barcode,
        patientId: userId,
        organizationId: organizationId!,
        traceId: req.traceId,
      });

      if (!result.success) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: result.error || "Failed to register DNA kit",
        });
      }

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Patient DNA kit self-registration",
        metadata: {
          barcode,
          dnaResultKitId: result.dnaResultKitId,
        },
        priority: Priority.MEDIUM,
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          dnaResultKitId: result.dnaResultKitId,
        },
        message: result.message || "DNA kit registered successfully",
      });
    } catch (err) {
      logger.error("Register patient DNA kit failed", {
        traceId: req.traceId,
        method: "registerPatientDNAKit.Patient",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to register DNA kit",
        },
        req,
      );
    }
  }
}

export default PatientController;
