import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { AuthenticatedRequest, StatusCode } from '../types';
import { prisma } from '../lib/prisma';
import { logger } from '../helpers/logger.helper';
import { supabase } from '../lib/supabase';

class AdminController {
  public static async createAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      // await supabase.auth.admin.createUser({
       
      //   email_confirm: true
      // });
      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'User fetched successfully'
      });
    }
    catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to fetch user'
      });
    }
  }

  public static async createDoctor(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'User fetched successfully'
      });
    }
    catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to fetch user'
      });
    }
  }

  public static async createPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'User fetched successfully'
      });
    }
    catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to fetch user'
      });
    }
  }
}

export default AdminController;
