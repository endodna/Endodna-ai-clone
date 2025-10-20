import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { logger } from '../helpers/logger.helper';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';

export const PatientAuthorization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.user_type !== UserType.PATIENT) {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: 'Unauthorized'
      });
    }
    next();
  } catch (err) {
    logger.error('User authorization error', { 
      traceId: req.traceId,
      error: String(err) 
    });
    return sendResponse(res, {
      status: StatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      message: 'Authorization error'
    });
  }
};

export const AdminAuthorization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.user_type !== 'ADMIN') {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: 'Unauthorized'
      });
    }
    next();
  } catch (err) {
    logger.error('Admin authorization error', { 
      traceId: req.traceId,
      error: String(err) 
    });
    return sendResponse(res, {
      status: StatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      message: 'Authorization error'
    });
  }
};

export const SAdminAuthorization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.user_type !== 'ADMIN') {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: 'Unauthorized'
      });
    }
    next();
  } catch (err) {
    logger.error('Admin authorization error', { 
      traceId: req.traceId,
      error: String(err) 
    });
    return sendResponse(res, {
      status: StatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      message: 'Authorization error'
    });
  }
};
