import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';
import { prisma } from '../lib/prisma';
import { logger } from '../helpers/logger.helper';
import { getMenu } from '../helpers/menu.helper';

class DoctorController {
    public static async createPatient(req: AuthenticatedRequest, res: Response) {
        try {
            const { user } = req;
        } catch (err) {
            sendResponse(res, {
                status: StatusCode.INTERNAL_SERVER_ERROR,
                error: true,
                message: 'Failed to create patient'
            });
        }
    }
}

export default DoctorController;
