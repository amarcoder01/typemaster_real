/**
 * Error Reporting Service
 * 
 * Centralized error reporting for production-ready error tracking.
 * Reports errors to backend API for storage/analysis and provides
 * client-side rate limiting to prevent spam.
 */

interface ErrorReportPayload {
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
  timestamp: string;
  url: string;
  userAgent: string;
}

interface ErrorReportingConfig {
  endpoint: string;
  maxReportsPerMinute: number;
  enabled: boolean;
}

const config: ErrorReportingConfig = {
  endpoint: '/api/error-report',
  maxReportsPerMinute: 10,
  enabled: import.meta.env.PROD,
};

let reportCount = 0;
let lastResetTime = Date.now();

function resetRateLimitIfNeeded(): void {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    reportCount = 0;
    lastResetTime = now;
  }
}

function isRateLimited(): boolean {
  resetRateLimitIfNeeded();
  return reportCount >= config.maxReportsPerMinute;
}

/**
 * Report an error to the backend for tracking
 */
export async function reportError(
  error: Error,
  errorInfo?: { componentStack?: string },
  context?: Record<string, unknown>
): Promise<void> {
  if (!config.enabled) {
    return;
  }

  if (isRateLimited()) {
    return;
  }

  reportCount++;

  const errorReport: ErrorReportPayload = {
    error: {
      message: error.message,
      code: error.name,
      stack: error.stack,
    },
    context: {
      ...context,
      componentStack: errorInfo?.componentStack,
    },
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(errorReport),
    });
  } catch {
    // Silently fail - we don't want error reporting to cause more errors
  }
}

/**
 * Report a handled exception (non-boundary errors)
 */
export function reportHandledError(
  error: Error,
  context?: Record<string, unknown>
): void {
  reportError(error, undefined, { ...context, handled: true });
}

/**
 * Create a context-aware error reporter
 */
export function createErrorReporter(defaultContext: Record<string, unknown>) {
  return {
    report: (error: Error, additionalContext?: Record<string, unknown>) => {
      reportError(error, undefined, { ...defaultContext, ...additionalContext });
    },
    reportWithInfo: (
      error: Error,
      errorInfo: { componentStack?: string },
      additionalContext?: Record<string, unknown>
    ) => {
      reportError(error, errorInfo, { ...defaultContext, ...additionalContext });
    },
  };
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  if (!config.enabled) {
    return;
  }

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    reportError(error, undefined, { type: 'unhandledRejection' });
  });

  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error
      ? event.error
      : new Error(event.message);
    
    reportError(error, undefined, { 
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}
