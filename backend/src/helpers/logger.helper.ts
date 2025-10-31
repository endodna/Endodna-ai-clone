import winston from "winston";
import CloudWatchTransport from "winston-cloudwatch";
import { LogContext } from "../types";

function getLogGroupName(): string | null {
  const cloudWatchLogArn = process.env.CLOUDWATCH_LOG_ARN;
  const cloudWatchLogGroup = process.env.CLOUDWATCH_LOG_GROUP;

  if (cloudWatchLogArn) {
    const arnParts = cloudWatchLogArn.split(":");
    if (arnParts.length >= 7 && arnParts[5] === "log-group") {
      return arnParts[6];
    }
  }

  return cloudWatchLogGroup || null;
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
];

const logGroupName = getLogGroupName();
if (logGroupName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logStreamName = `biosai-core-${timestamp}`;

  transports.push(
    new CloudWatchTransport({
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      awsRegion: process.env.AWS_REGION || "us-east-1",
      messageFormatter: ({ level, message, timestamp, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...meta,
        });
      },
      jsonMessage: true,
    }),
  );
}

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports,
  exitOnError: false,
});

function formatErrorForLogging(error: any): Record<string, any> {
  if (error instanceof Error) {
    return {
      error: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  
  if (typeof error === "string") {
    return {
      error,
    };
  }
  
  if (typeof error === "object" && error !== null) {
    return {
      error: error.message || error.error || String(error),
      stack: error.stack,
      ...error,
    };
  }
  
  return {
    error: String(error),
  };
}

class Logger {
  private formatContext(context?: LogContext): Record<string, any> {
    if (!context) {
      return {
        traceId: "00000000-0000-0000-0000-000000000000",
      };
    }

    const formattedContext: Record<string, any> = {
      traceId: context.traceId || "00000000-0000-0000-0000-000000000000",
    };

    Object.keys(context).forEach((key) => {
      if (key === "traceId") {
        return;
      }
      const value = (context as any)[key];
      if (key === "error" || value instanceof Error) {
        Object.assign(formattedContext, formatErrorForLogging(value));
      } else {
        formattedContext[key] = value;
      }
    });

    return formattedContext;
  }

  info(message: string, context?: LogContext): void {
    winstonLogger.info(message, this.formatContext(context));
  }

  warn(message: string, context?: LogContext): void {
    winstonLogger.warn(message, this.formatContext(context));
  }

  error(message: string, context?: LogContext): void {
    winstonLogger.error(message, this.formatContext(context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      winstonLogger.debug(message, this.formatContext(context));
    }
  }
}

export const logger = new Logger();
export default logger;
