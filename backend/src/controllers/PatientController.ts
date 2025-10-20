import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { AuthenticatedRequest, StatusCode } from '../types';
import { prisma } from '../lib/prisma';

class PatientController {
  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;

      sendResponse(res, {
        status: StatusCode.OK,
        data: {},
        message: 'Profile fetched successfully'
      });
    } catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to fetch profile'
      });
    }
  }
}

export default PatientController;
