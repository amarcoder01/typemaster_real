import { useState, useCallback } from "react";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: Error | null;
}

/**
 * Hook for retrying failed operations with exponential backoff
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
  });

  const executeWithRetry = useCallback(
    async (): Promise<T> => {
      let attempt = 0;
      let delay = initialDelay;

      while (attempt < maxAttempts) {
        try {
          setState({ isRetrying: attempt > 0, attempt, lastError: null });
          const result = await fn();
          setState({ isRetrying: false, attempt: 0, lastError: null });
          return result;
        } catch (error) {
          attempt++;
          const err = error as Error;

          if (attempt >= maxAttempts) {
            setState({ isRetrying: false, attempt, lastError: err });
            throw err;
          }

          // Call retry callback
          if (onRetry) {
            onRetry(attempt, err);
          }

          // Wait before retrying with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
      }

      throw new Error("Max retry attempts reached");
    },
    [fn, maxAttempts, initialDelay, maxDelay, backoffMultiplier, onRetry]
  );

  const reset = useCallback(() => {
    setState({ isRetrying: false, attempt: 0, lastError: null });
  }, []);

  return {
    execute: executeWithRetry,
    ...state,
    reset,
  };
}

/**
 * Utility to check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.name === "NetworkError" || error.message?.includes("fetch")) {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.response?.status) {
    const status = error.response.status;
    return status === 408 || status === 429 || status >= 500;
  }

  return false;
}

/**
 * Hook for retrying API calls with React Query
 */
export function getRetryConfig(maxRetries: number = 3) {
  return {
    retry: (failureCount: number, error: any) => {
      if (failureCount >= maxRetries) return false;
      return isRetryableError(error);
    },
    retryDelay: (attemptIndex: number) => {
      return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
    },
  };
}

