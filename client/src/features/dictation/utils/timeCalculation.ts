/**
 * Time Calculation Utilities for Dictation Challenge Mode
 * 
 * Provides WPM-based time limit calculations that scale properly with content length.
 */

import type { DictationSentence } from '@shared/schema';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default configuration for time limit calculations
 */
export const TIME_LIMIT_DEFAULTS = {
  /** Base expected WPM for calculating time limits */
  expectedWpm: 40,
  /** Buffer multiplier to give users extra time (1.5 = 50% extra time) */
  bufferMultiplier: 1.5,
  /** Minimum time limit in seconds (ensures very short content still has reasonable time) */
  minimumSeconds: 15,
  /** Average characters per word for WPM calculations */
  charsPerWord: 5,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TimeCalculationInput {
  /** Total characters to type in the session */
  totalCharacters: number;
  /** Expected typing speed in WPM (default: 40) */
  expectedWpm?: number;
  /** Buffer multiplier for extra time (default: 1.5) */
  bufferMultiplier?: number;
}

export interface TimeCalculationResult {
  /** Final time limit in seconds */
  timeLimitSeconds: number;
  /** Base time without buffer in seconds */
  baseSeconds: number;
  /** Additional buffer time in seconds */
  bufferSeconds: number;
  /** Characters used in calculation */
  totalCharacters: number;
  /** WPM used in calculation */
  expectedWpm: number;
  /** Buffer multiplier used */
  bufferMultiplier: number;
}

export interface SessionTimeInput {
  /** Array of sentences in the session */
  sentences: DictationSentence[];
  /** Expected typing speed in WPM (default: 40) */
  expectedWpm?: number;
  /** Buffer multiplier for extra time (default: 1.5) */
  bufferMultiplier?: number;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate time limit based on character count and WPM.
 * 
 * Formula: timeSeconds = (totalCharacters / charsPerWord / expectedWpm) * 60 * bufferMultiplier
 * 
 * Example:
 * - 250 characters at 40 WPM with 1.5x buffer
 * - Base: (250 / 5 / 40) * 60 = 75 seconds
 * - With buffer: 75 * 1.5 = 112.5 seconds (~113 seconds)
 * 
 * @param input - Configuration for time calculation
 * @returns Time limit details including base and buffer breakdown
 */
export function calculateTimeLimit(input: TimeCalculationInput): TimeCalculationResult {
  const {
    totalCharacters,
    expectedWpm = TIME_LIMIT_DEFAULTS.expectedWpm,
    bufferMultiplier = TIME_LIMIT_DEFAULTS.bufferMultiplier,
  } = input;

  // Validate inputs
  if (totalCharacters <= 0) {
    return {
      timeLimitSeconds: TIME_LIMIT_DEFAULTS.minimumSeconds,
      baseSeconds: TIME_LIMIT_DEFAULTS.minimumSeconds,
      bufferSeconds: 0,
      totalCharacters: 0,
      expectedWpm,
      bufferMultiplier,
    };
  }

  // Calculate words from characters
  const totalWords = totalCharacters / TIME_LIMIT_DEFAULTS.charsPerWord;

  // Calculate base time in seconds: (words / wpm) * 60
  const baseSeconds = (totalWords / expectedWpm) * 60;

  // Apply buffer multiplier
  const timeLimitWithBuffer = baseSeconds * bufferMultiplier;

  // Ensure minimum time
  const finalTimeLimit = Math.max(
    Math.ceil(timeLimitWithBuffer),
    TIME_LIMIT_DEFAULTS.minimumSeconds
  );

  // Calculate actual buffer seconds used
  const bufferSeconds = Math.ceil(timeLimitWithBuffer - baseSeconds);

  return {
    timeLimitSeconds: finalTimeLimit,
    baseSeconds: Math.ceil(baseSeconds),
    bufferSeconds,
    totalCharacters,
    expectedWpm,
    bufferMultiplier,
  };
}

/**
 * Calculate session time limit from an array of sentences.
 * Aggregates total characters from all sentences and calculates appropriate time.
 * 
 * @param input - Session configuration with sentences array
 * @returns Time limit details for the entire session
 */
export function calculateSessionTimeLimit(input: SessionTimeInput): TimeCalculationResult {
  const { sentences, expectedWpm, bufferMultiplier } = input;

  // Calculate total characters from all sentences
  const totalCharacters = sentences.reduce((sum, sentence) => {
    return sum + (sentence.sentence?.length || 0);
  }, 0);

  return calculateTimeLimit({
    totalCharacters,
    expectedWpm,
    bufferMultiplier,
  });
}

/**
 * Calculate time limit for a single sentence.
 * Useful for per-sentence timing in non-batch modes.
 * 
 * @param sentence - The sentence to calculate time for
 * @param expectedWpm - Expected WPM (default: 40)
 * @param bufferMultiplier - Buffer multiplier (default: 1.5)
 * @returns Time limit details for the sentence
 */
export function calculateSentenceTimeLimit(
  sentence: string,
  expectedWpm: number = TIME_LIMIT_DEFAULTS.expectedWpm,
  bufferMultiplier: number = TIME_LIMIT_DEFAULTS.bufferMultiplier
): TimeCalculationResult {
  return calculateTimeLimit({
    totalCharacters: sentence.length,
    expectedWpm,
    bufferMultiplier,
  });
}

/**
 * Format seconds into human-readable time string.
 * 
 * @param seconds - Total seconds
 * @returns Formatted string like "1:30" or "2:05"
 */
export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get percentage of time remaining.
 * 
 * @param remainingSeconds - Seconds remaining
 * @param totalSeconds - Total time limit
 * @returns Percentage (0-100)
 */
export function getTimePercentage(remainingSeconds: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 100;
  return Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
}

/**
 * Get color class based on time percentage remaining.
 * Uses dynamic thresholds based on remaining percentage rather than fixed seconds.
 * 
 * @param percentage - Percentage of time remaining (0-100)
 * @returns Object with text, background, and dot color classes
 */
export function getTimerColors(percentage: number): {
  textColor: string;
  bgColor: string;
  dotColor: string;
  urgency: 'safe' | 'warning' | 'danger' | 'critical';
} {
  if (percentage > 50) {
    return {
      textColor: 'text-green-600',
      bgColor: 'bg-green-500/10',
      dotColor: 'bg-green-600',
      urgency: 'safe',
    };
  } else if (percentage > 25) {
    return {
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-500/20',
      dotColor: 'bg-yellow-600',
      urgency: 'warning',
    };
  } else if (percentage > 10) {
    return {
      textColor: 'text-orange-500',
      bgColor: 'bg-orange-500/20',
      dotColor: 'bg-orange-500',
      urgency: 'danger',
    };
  } else {
    return {
      textColor: 'text-red-600',
      bgColor: 'bg-red-500/20',
      dotColor: 'bg-red-600',
      urgency: 'critical',
    };
  }
}

/**
 * Get urgency message based on time remaining.
 * 
 * @param urgency - Urgency level from getTimerColors
 * @returns User-friendly message
 */
export function getUrgencyMessage(urgency: 'safe' | 'warning' | 'danger' | 'critical'): string {
  switch (urgency) {
    case 'safe':
      return 'Good pace';
    case 'warning':
      return 'Keep typing';
    case 'danger':
      return 'Hurry up!';
    case 'critical':
      return 'Almost out of time!';
  }
}
