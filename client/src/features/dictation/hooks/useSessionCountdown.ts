import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSessionCountdownOptions {
  /** Initial time in seconds */
  initialTime: number | null;
  /** Called every second with remaining time */
  onTick?: (remaining: number) => void;
  /** Called when countdown reaches zero */
  onTimeout?: () => void;
  /** Whether to auto-start */
  autoStart?: boolean;
  /** Whether the countdown is paused */
  isPaused?: boolean;
}

interface UseSessionCountdownReturn {
  /** Current remaining time in seconds */
  remainingTime: number | null;
  /** Whether the countdown is actively running */
  isRunning: boolean;
  /** Whether time has run out */
  isTimedOut: boolean;
  /** Start the countdown */
  start: (time?: number) => void;
  /** Stop the countdown */
  stop: () => void;
  /** Reset to initial time */
  reset: () => void;
  /** Pause the countdown */
  pause: () => void;
  /** Resume the countdown */
  resume: () => void;
}

/**
 * Hook for session countdown timer with timeout handling.
 * Used in Challenge Mode to count down from a calculated time limit.
 */
export function useSessionCountdown(options: UseSessionCountdownOptions): UseSessionCountdownReturn {
  const {
    initialTime,
    onTick,
    onTimeout,
    autoStart = false,
    isPaused = false,
  } = options;
  
  const [remainingTime, setRemainingTime] = useState<number | null>(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const onTickRef = useRef(onTick);
  const onTimeoutRef = useRef(onTimeout);
  
  // Update callback refs
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);
  
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);
  
  // Clear interval helper
  const clearCountdownInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Start countdown
  const start = useCallback((time?: number) => {
    if (!isMountedRef.current) return;
    
    clearCountdownInterval();
    
    const startTime = time ?? initialTime;
    if (startTime === null || startTime <= 0) return;
    
    setRemainingTime(startTime);
    setIsRunning(true);
    setIsTimedOut(false);
    
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      setRemainingTime(prev => {
        if (prev === null || prev <= 0) {
          clearCountdownInterval();
          setIsRunning(false);
          setIsTimedOut(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              onTimeoutRef.current?.();
            }
          }, 0);
          return 0;
        }
        
        const newTime = prev - 1;
        onTickRef.current?.(newTime);
        
        if (newTime <= 0) {
          clearCountdownInterval();
          setIsRunning(false);
          setIsTimedOut(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              onTimeoutRef.current?.();
            }
          }, 0);
        }
        
        return newTime;
      });
    }, 1000);
  }, [initialTime, clearCountdownInterval]);
  
  // Stop countdown
  const stop = useCallback(() => {
    clearCountdownInterval();
    setIsRunning(false);
  }, [clearCountdownInterval]);
  
  // Reset countdown
  const reset = useCallback(() => {
    clearCountdownInterval();
    setRemainingTime(initialTime);
    setIsRunning(false);
    setIsTimedOut(false);
  }, [initialTime, clearCountdownInterval]);
  
  // Pause countdown
  const pause = useCallback(() => {
    clearCountdownInterval();
    setIsRunning(false);
  }, [clearCountdownInterval]);
  
  // Resume countdown
  const resume = useCallback(() => {
    if (!isMountedRef.current || remainingTime === null || remainingTime <= 0) return;
    
    setIsRunning(true);
    
    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      setRemainingTime(prev => {
        if (prev === null || prev <= 0) {
          clearCountdownInterval();
          setIsRunning(false);
          setIsTimedOut(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              onTimeoutRef.current?.();
            }
          }, 0);
          return 0;
        }
        
        const newTime = prev - 1;
        onTickRef.current?.(newTime);
        
        if (newTime <= 0) {
          clearCountdownInterval();
          setIsRunning(false);
          setIsTimedOut(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              onTimeoutRef.current?.();
            }
          }, 0);
        }
        
        return newTime;
      });
    }, 1000);
  }, [remainingTime, clearCountdownInterval]);
  
  // Handle pause state changes
  useEffect(() => {
    if (isPaused && isRunning) {
      pause();
    } else if (!isPaused && remainingTime !== null && remainingTime > 0 && !isRunning && !isTimedOut) {
      // Only auto-resume if we were previously running and got paused
    }
  }, [isPaused, isRunning, remainingTime, isTimedOut, pause]);
  
  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && initialTime && !isRunning && !isTimedOut) {
      start(initialTime);
    }
  }, [autoStart, initialTime, isRunning, isTimedOut, start]);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearCountdownInterval();
    };
  }, [clearCountdownInterval]);
  
  return {
    remainingTime,
    isRunning,
    isTimedOut,
    start,
    stop,
    reset,
    pause,
    resume,
  };
}
