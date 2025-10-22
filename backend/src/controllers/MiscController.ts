import { Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { AuthenticatedRequest, StatusCode } from '../types';
import { logger } from '../helpers/logger.helper';
import { getMenu } from '../helpers/menu.helper';

class MiscController {
  public static async getMenu(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const menu = getMenu(user?.userType!);
      sendResponse(res, {
        status: StatusCode.OK,
        data: menu,
        message: 'Menu fetched successfully'
      });
    } catch (err) {
      logger.error("Error");
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to fetch menu'
      });
    }
  }
}

export default MiscController;
