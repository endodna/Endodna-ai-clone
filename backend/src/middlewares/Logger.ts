import { Request, Response, NextFunction } from "express";
import { logger } from "../helpers/logger.helper";
import { responseHelper } from "../helpers/response.helper";
import { generateTraceId } from "../helpers/misc.helper";
import { sanitizeForLogging } from "../helpers/sanitize.helper";

export interface RequestWithTrace extends Request {
  traceId?: string;
  startTime?: number;
}

export const requestLogger = (
  req: RequestWithTrace,
  res: Response,
  next: NextFunction,
) => {
  req.traceId = generateTraceId();
  req.startTime = Date.now();

  logger.info("Incoming request", {
    traceId: req.traceId || "00000000-0000-0000-0000-000000000000",
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    body: sanitizeForLogging(req.body),
  });

  // const originalSend = res.send;
  const originalJson = res.json;

  const logResponse = (data: any): any => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    let responseBody: any = null;
    try {
      if (typeof data === "string") {
        responseBody = JSON.parse(data);
      } else {
        responseBody = data;
      }
    } catch {
      responseBody = data;
    }

    logger.info("Outgoing response", {
      traceId: req.traceId || "00000000-0000-0000-0000-000000000000",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      body: sanitizeForLogging(responseBody),
    });

    return data;
  };

  // res.send = function (data: any): Response {
  //   logResponse(data);

  //   // Add configured response headers
  //   const headers = responseHelper.getResponseHeaders(req);
  //   Object.entries(headers).forEach(([name, value]) => {
  //     res.set(name, value);
  //   });

  //   return originalSend.call(this, data);
  // };

  res.json = function (data: any): Response {
    logResponse(data);

    // Add configured response headers
    const headers = responseHelper.getResponseHeaders(req);
    Object.entries(headers).forEach(([name, value]) => {
      res.set(name, value);
    });

    return originalJson.call(this, data);
  };

  next();
};
