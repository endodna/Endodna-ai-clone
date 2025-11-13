import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode, UserType } from "../types";
import { logger } from "../helpers/logger.helper";
import { getMenu } from "../helpers/menu.helper";
import {
  ChatMessageRole,
  ChatType,
  DNAResultStatus,
  MedicalRecordType,
  Priority,
  RequestType,
  Status,
} from "@prisma/client";

class MiscController {
  public static async getMenu(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const menu = getMenu(user?.userType as UserType);
      sendResponse(res, {
        status: StatusCode.OK,
        data: menu,
        message: "Menu fetched successfully",
      });
    } catch (err) {
      logger.error("Get menu failed", {
        traceId: req.traceId,
        method: "getMenu",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch menu",
        },
        req,
      );
    }
  }

  public static async getConstants(req: AuthenticatedRequest, res: Response) {
    try {
      const constants = {
        status: Object.values(Status),
        dnaResultStatus: Object.values(DNAResultStatus),
        medicalRecordType: Object.values(MedicalRecordType),
        priority: Object.values(Priority),
        requestType: Object.values(RequestType),
        chatType: Object.values(ChatType),
        chatMessageRole: Object.values(ChatMessageRole),
      };

      sendResponse(res, {
        status: StatusCode.OK,
        data: constants,
        message: "Constants fetched successfully",
      });
    } catch (err) {
      logger.error("Get constants failed", {
        traceId: req.traceId,
        method: "getConstants",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch constants",
        },
        req,
      );
    }
  }
}

export default MiscController;
