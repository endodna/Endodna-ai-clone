import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";

class DoctorController {
  public static async createPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const { user: _user } = req;
    } catch (_err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: "Failed to create patient",
      });
    }
  }
}

export default DoctorController;
