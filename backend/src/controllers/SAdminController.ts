import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { AuthenticatedRequest, StatusCode } from '../types';
import { prisma } from '../lib/prisma';
import { logger } from '../helpers/logger.helper';

class SAdminController {
  public static async createServiceToken(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'Service token created successfully'
      });
    } catch (err) {
      logger.error("Error");
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to create service token'
      });
    }
  }
  public static async provisionOrganization(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'Organization provisioned successfully'
      });
    } catch (err) {
      logger.error("Error");
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to provision organization'
      });
    }
  }
  public static async createOrganizationAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'Organization admin created successfully'
      });
    } catch (err) {
      logger.error("Error");
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to create organization admin'
      });
    }
  }
}

export default SAdminController;
