import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import _ from "lodash";
import { sendResponse } from "../helpers/response.helper";
import { StatusCode } from "../types";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const flattenedErrors = _.flattenDeep(error.errors);
        const errorMessages = flattenedErrors.map((err) => ({
          field: err.path.join("."),
          message: err.message as string,
        }));

        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          data: { errors: errorMessages },
          message: "Validation failed",
        });
      }

      return sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: "Validation error",
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          data: { errors: errorMessages },
          message: "Query validation failed",
        });
      }

      return sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: "Query validation error",
      });
    }
  };
};
