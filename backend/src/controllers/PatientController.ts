import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { logger } from "../helpers/logger.helper";

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
}

export default PatientController;
