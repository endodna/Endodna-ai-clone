import { Request, Response, NextFunction } from "express";
import { logger } from "../helpers/logger.helper";
import { responseHelper } from "../helpers/response.helper";
import { generateTraceId } from "../helpers/misc.helper";

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
  });

  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    // Add configured response headers
    const headers = responseHelper.getResponseHeaders(req);
    Object.entries(headers).forEach(([name, value]) => {
      res.set(name, value);
    });

    logger.info("Outgoing response", {
      traceId: req.traceId || "00000000-0000-0000-0000-000000000000",
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    return originalSend.call(this, data);
  };

  next();
};
