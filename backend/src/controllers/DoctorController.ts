import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { logger } from "../helpers/logger.helper";

class DoctorController {
  public static async createPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const { user: _user } = req;
    } catch (err) {
      logger.error("Create patient failed", {
        traceId: req.traceId,
        method: "createPatient",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to create patient",
      }, req);
    }
  }
}

export default DoctorController;
