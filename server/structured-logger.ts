/**
 * Structured Logging System
 * Provides consistent, searchable logs with proper context
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface LogContext {
  service?: string;
  userId?: string;
  requestId?: string;
  feedbackId?: number;
  adminId?: string;
  ipAddress?: string;
  duration?: number;
  [key: string]: any;
}

export class StructuredLogger {
  private service: string;
  private minLevel: LogLevel;

  constructor(service: string, minLevel: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.service,
      message,
      ...context,
    };

    // In production, you'd send this to a log aggregation service
    // For now, we'll format it as JSON for easy parsing
    return JSON.stringify(logEntry);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedLog = this.formatLog(level, message, context);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  critical(message: string, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, context);
  }

  /**
   * Log with timing information
   */
  timed(message: string, startTime: number, context?: LogContext): void {
    const duration = Date.now() - startTime;
    this.info(message, { ...context, duration });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger(this.service, this.minLevel);
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, context?: LogContext) => {
      originalLog(level, message, { ...additionalContext, ...context });
    };
    return childLogger;
  }
}

// Global loggers for different services
const loggers = new Map<string, StructuredLogger>();

/**
 * Get or create a logger for a service
 */
export function getLogger(service: string, minLevel?: LogLevel): StructuredLogger {
  if (!loggers.has(service)) {
    const level = minLevel || (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    loggers.set(service, new StructuredLogger(service, level));
  }
  return loggers.get(service)!;
}

// Pre-configured loggers for feedback system
export const feedbackLogger = getLogger("feedback");
export const feedbackAdminLogger = getLogger("feedback-admin");
export const feedbackAILogger = getLogger("feedback-ai");

