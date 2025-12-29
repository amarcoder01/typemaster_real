/**
 * Feedback System Error Handling
 * Provides structured error responses with error codes for better debugging
 */

export enum FeedbackErrorCode {
  // Validation Errors (4xx)
  INVALID_INPUT = "FEEDBACK_INVALID_INPUT",
  INVALID_FEEDBACK_ID = "FEEDBACK_INVALID_ID",
  INVALID_CATEGORY = "FEEDBACK_INVALID_CATEGORY",
  INVALID_QUERY_PARAMS = "FEEDBACK_INVALID_QUERY",
  
  // Authorization Errors (403)
  INSUFFICIENT_PERMISSIONS = "FEEDBACK_INSUFFICIENT_PERMISSIONS",
  ADMIN_ACCESS_DENIED = "FEEDBACK_ADMIN_ACCESS_DENIED",
  
  // Not Found Errors (404)
  FEEDBACK_NOT_FOUND = "FEEDBACK_NOT_FOUND",
  CATEGORY_NOT_FOUND = "FEEDBACK_CATEGORY_NOT_FOUND",
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = "FEEDBACK_RATE_LIMIT_EXCEEDED",
  TEMPORARILY_BLOCKED = "FEEDBACK_TEMPORARILY_BLOCKED",
  
  // Server Errors (5xx)
  DATABASE_ERROR = "FEEDBACK_DATABASE_ERROR",
  AI_PROCESSING_ERROR = "FEEDBACK_AI_ERROR",
  EMAIL_SEND_ERROR = "FEEDBACK_EMAIL_ERROR",
  INTERNAL_ERROR = "FEEDBACK_INTERNAL_ERROR",
}

export class FeedbackError extends Error {
  constructor(
    public code: FeedbackErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "FeedbackError";
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export class ValidationError extends FeedbackError {
  constructor(message: string, details?: any) {
    super(FeedbackErrorCode.INVALID_INPUT, message, 400, details);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends FeedbackError {
  constructor(message: string = "Insufficient permissions") {
    super(FeedbackErrorCode.INSUFFICIENT_PERMISSIONS, message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends FeedbackError {
  constructor(resource: string = "Feedback") {
    super(
      FeedbackErrorCode.FEEDBACK_NOT_FOUND,
      `${resource} not found`,
      404
    );
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends FeedbackError {
  constructor(message: string, details?: any) {
    super(FeedbackErrorCode.RATE_LIMIT_EXCEEDED, message, 429, details);
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends FeedbackError {
  constructor(message: string, originalError?: Error) {
    super(
      FeedbackErrorCode.DATABASE_ERROR,
      "Database operation failed",
      500,
      { originalMessage: message, stack: originalError?.stack }
    );
    this.name = "DatabaseError";
  }
}

/**
 * Middleware to handle feedback-specific errors
 */
export function feedbackErrorHandler(err: any, req: any, res: any, next: any) {
  if (err instanceof FeedbackError) {
    // Log error with request context
    console.error(`[Feedback Error] ${err.code}:`, {
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      requestId: req.id,
    });

    return res.status(err.statusCode).json(err.toJSON());
  }

  // Pass to next error handler if not a FeedbackError
  next(err);
}

