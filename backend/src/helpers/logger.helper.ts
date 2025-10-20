import { LogContext, LogLevel } from "../types";

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      traceId: context?.traceId || '00000000-0000-0000-0000-000000000000',
      ...context,
    };
    return JSON.stringify(logData);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog(LogLevel.WARN, message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatLog(LogLevel.ERROR, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }
}

export const logger = new Logger();

