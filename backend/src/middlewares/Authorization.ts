import { Response, NextFunction } from "express";
import { sendResponse } from "../helpers/response.helper";
import { logger } from "../helpers/logger.helper";
import { AuthenticatedRequest, StatusCode, UserType } from "../types";

export const PatientAuthorization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.isPasswordSet === false) {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: "PasswordNotSet",
      });
    }
    if (req.user?.userType !== UserType.PATIENT) {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: "Unauthorized",
      });
    }
    next();
  } catch (err) {
    logger.error("User authorization error", {
      traceId: req.traceId,
      error: String(err),
    });
    return sendResponse(res, {
      status: StatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      message: "Authorization error",
    });
  }
};

export const DoctorAuthorization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.isPasswordSet === false) {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: "PasswordNotSet",
      });
    }
    if (req.user?.userType === UserType.DOCTOR || req.user?.userType === UserType.ADMIN) {
      next();
    }
    return sendResponse(res, {
      status: StatusCode.UNAUTHORIZED,
      error: true,
      message: "Unauthorized",
    });
  } catch (err) {
    logger.error("Doctor authorization error", {
      traceId: req.traceId,
      error: String(err),
    });
    return sendResponse(res, {
      status: StatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      message: "Authorization error",
    });
  }
};

export const AdminAuthorization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.isPasswordSet === false) {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: "PasswordNotSet",
      });
    }
    if (req.user?.userType !== UserType.ADMIN) {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: "Unauthorized",
      });
    }
    next();
  } catch (err) {
    logger.error("Admin authorization error", {
      traceId: req.traceId,
      error: String(err),
    });
    return sendResponse(res, {
      status: StatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      message: "Authorization error",
    });
  }
};

export const SAdminAuthorization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.userType !== UserType.SUPER_ADMIN) {
      return sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: "Unauthorized",
      });
    }
    next();
  } catch (err) {
    logger.error("Super Admin authorization error", {
      traceId: req.traceId,
      error: String(err),
    });
    return sendResponse(res, {
      status: StatusCode.INTERNAL_SERVER_ERROR,
      error: true,
      message: "Authorization error",
    });
  }
};
