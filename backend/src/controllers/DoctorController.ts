import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';
import { prisma } from '../lib/prisma';
import { logger } from '../helpers/logger.helper';
import { getMenu } from '../helpers/menu.helper';

class DoctorController {
  
}

export default DoctorController;
