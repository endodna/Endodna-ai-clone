import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode, UserType } from "../types";
import { logger } from "../helpers/logger.helper";
import { getMenu } from "../helpers/menu.helper";

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
}

export default MiscController;
