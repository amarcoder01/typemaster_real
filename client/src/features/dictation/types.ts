import type { DictationSentence } from '@shared/schema';
import type { CharacterDiff, WordDiff } from '@shared/dictation-utils';

// ============================================================================
// PRACTICE MODES
// ============================================================================

export type PracticeMode = 'quick' | 'focus' | 'challenge';

export interface PracticeModeConfig {
  name: string;
  description: string;
  autoAdvance: boolean;
  hintsAllowed: boolean;
  timerPressure: boolean;
  defaultSpeed: string;
  defaultDifficulty: DifficultyLevel;
  maxReplays?: number;
}

export const PRACTICE_MODES: Record<PracticeMode, PracticeModeConfig> = {
  quick: {
    name: 'Quick Practice',
    description: 'Fast-paced practice sessions',
    autoAdvance: false,
    hintsAllowed: true,
    timerPressure: false,
    defaultSpeed: '1.0',
    defaultDifficulty: 'easy',
  },
  focus: {
    name: 'Focus Mode',
    description: 'Deep listening with limited replays - no hints',
    autoAdvance: false,
    hintsAllowed: false,
    timerPressure: false,
    defaultSpeed: '0.8',
    defaultDifficulty: 'easy',
    maxReplays: 5,
  },
  challenge: {
    name: 'Challenge Mode',
    description: 'No hints, timed pressure, prove your skills',
    autoAdvance: false,
    hintsAllowed: false,
    timerPressure: true,
    defaultSpeed: '1.3',
    defaultDifficulty: 'easy',
  },
};

// ============================================================================
// ZEN MODE THEMES
// ============================================================================

export type ZenTheme = 'ocean' | 'forest' | 'sunset' | 'night';

export interface ZenThemeConfig {
  name: string;
  gradient: string;
  textColor: string;
  accentColor: string;
  inputBg: string;
  buttonBg: string;
}

export const ZEN_THEMES: Record<ZenTheme, ZenThemeConfig> = {
  ocean: {
    name: 'Ocean Calm',
    gradient: 'linear-gradient(135deg, #1a365d 0%, #2c5282 30%, #2b6cb0 60%, #3182ce 100%)',
    textColor: '#e2e8f0',
    accentColor: '#63b3ed',
    inputBg: 'rgba(255, 255, 255, 0.1)',
    buttonBg: 'rgba(99, 179, 237, 0.3)',
  },
  forest: {
    name: 'Forest Peace',
    gradient: 'linear-gradient(135deg, #1a4731 0%, #22543d 30%, #276749 60%, #2f855a 100%)',
    textColor: '#e2e8f0',
    accentColor: '#68d391',
    inputBg: 'rgba(255, 255, 255, 0.1)',
    buttonBg: 'rgba(104, 211, 145, 0.3)',
  },
  sunset: {
    name: 'Sunset Glow',
    gradient: 'linear-gradient(135deg, #744210 0%, #c05621 30%, #dd6b20 60%, #ed8936 100%)',
    textColor: '#fffaf0',
    accentColor: '#fbd38d',
    inputBg: 'rgba(255, 255, 255, 0.1)',
    buttonBg: 'rgba(251, 211, 141, 0.3)',
  },
  night: {
    name: 'Night Sky',
    gradient: 'linear-gradient(135deg, #1a202c 0%, #2d3748 30%, #4a5568 60%, #718096 100%)',
    textColor: '#e2e8f0',
    accentColor: '#a0aec0',
    inputBg: 'rgba(255, 255, 255, 0.08)',
    buttonBg: 'rgba(160, 174, 192, 0.3)',
  },
};

// ============================================================================
// DIFFICULTY & ADAPTIVE SETTINGS
// ============================================================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_ORDER: DifficultyLevel[] = ['easy', 'medium', 'hard'];

export interface AdaptiveDifficultyConfig {
  enabled: boolean;
  currentLevel: DifficultyLevel;
  consecutiveHighScores: number;
  consecutiveLowScores: number;
  recentScores: { accuracy: number; wpm: number }[];
}

export const ADAPTIVE_THRESHOLDS = {
  upgradeAccuracy: 90,
  upgradeWpm: 30,
  upgradeConsecutive: 3,
  downgradeAccuracy: 70,
  downgradeConsecutive: 2,
  maxRecentScores: 5,
} as const;

// ============================================================================
// SESSION STATE
// ============================================================================

export interface DictationTestResult {
  accuracy: number;
  wpm: number;
  errors: number;
  duration: number;
  characterDiff: CharacterDiff[];
  wordDiff: WordDiff[];
  correctChars: number;
  totalChars: number;
  correctWords: number;
  totalWords: number;
}

export interface DictationTestState {
  sentence: DictationSentence | null;
  typedText: string;
  startTime: number | null;
  endTime: number | null;
  replayCount: number;
  hintShown: boolean;
  showHint: boolean;
  isComplete: boolean;
  result: DictationTestResult | null;
  // Challenge Mode time limit fields
  timeLimitMs: number | null;
  timeExpired: boolean;
  showTimeUpOverlay: boolean;
  showTimePreview: boolean;
}

// ============================================================================
// CHALLENGE MODE TIMING
// Industry-standard WPM-based time calculation
// Formula: Time = (Words / TargetWPM) * BufferFactor * 60 seconds
// ============================================================================

export const CHALLENGE_TIMING = {
  GRACE_PERIOD_MS: 3000,     // 3 second grace period after time expires
  WARNING_THRESHOLD_MS: 10000, // Yellow warning at 10 seconds remaining
  URGENT_THRESHOLD_MS: 5000,   // Red urgent at 5 seconds remaining
  MIN_TIME_MS: 5000,         // Minimum 5 seconds
  MAX_TIME_MS: 180000,       // Maximum 3 minutes
  DEFAULT_DIFFICULTY: 'medium' as DifficultyLevel,
  
  // Fixed time limits per difficulty (in milliseconds)
  // More challenging times to keep pressure on
  FIXED_TIME_MS: {
    easy: 30000,    // 30 seconds - challenging but achievable
    medium: 40000,  // 40 seconds - moderate challenge
    hard: 50000,    // 50 seconds - more time for complex sentences
  } as Record<DifficultyLevel, number>,
  
  // Legacy WPM-based config (kept for reference)
  DIFFICULTY_CONFIG: {
    easy: { targetWPM: 25, buffer: 2.5 },
    medium: { targetWPM: 40, buffer: 1.8 },
    hard: { targetWPM: 60, buffer: 1.4 },
  } as Record<DifficultyLevel, { targetWPM: number; buffer: number }>,
  
  // Overtime penalties
  OVERTIME_PENALTY_BASE: 0.05,    // 5% base penalty for any overtime
  OVERTIME_PENALTY_PER_SECOND: 0.01, // Additional 1% per second over time
  OVERTIME_PENALTY_MAX: 0.30,     // Maximum 30% penalty cap
  
  // Streak bonuses
  STREAK_BONUS: 0.02,        // 2% bonus per streak (max 10%)
  MAX_STREAK_BONUS: 0.10,    // Cap at 10% bonus
} as const;

/**
 * Calculate the overtime penalty based on how many seconds over the limit.
 * Penalty scales with lateness: 5% base + 1% per second, capped at 30%.
 */
export function calculateOvertimePenalty(secondsOvertime: number): number {
  if (secondsOvertime <= 0) return 0;
  
  const penalty = CHALLENGE_TIMING.OVERTIME_PENALTY_BASE + 
    (secondsOvertime * CHALLENGE_TIMING.OVERTIME_PENALTY_PER_SECOND);
  
  return Math.min(penalty, CHALLENGE_TIMING.OVERTIME_PENALTY_MAX);
}

/**
 * Calculate the time limit in milliseconds for a Challenge Mode sentence.
 * Uses industry-standard WPM-based formula:
 * Time = (WordCount / TargetWPM) * BufferFactor * 60 seconds
 * 
 * Example times for a 10-word sentence:
 * - Easy:   (10/25) * 2.5 * 60 = 60 seconds
 * - Medium: (10/40) * 1.8 * 60 = 27 seconds
 * - Hard:   (10/60) * 1.4 * 60 = 14 seconds
 * 
 * @param sentenceText - The sentence text to calculate time for
 * @param difficulty - The difficulty level (defaults to medium if invalid)
 * @returns Time limit in milliseconds, clamped to MIN_TIME_MS and MAX_TIME_MS
 */
export function calculateTimeLimit(
  sentenceText: string,
  difficulty: DifficultyLevel
): number {
  // Use fixed time limits per difficulty for consistent challenge
  const fixedTime = CHALLENGE_TIMING.FIXED_TIME_MS[difficulty] ?? 
    CHALLENGE_TIMING.FIXED_TIME_MS[CHALLENGE_TIMING.DEFAULT_DIFFICULTY];
  
  return fixedTime;
}

export interface SessionStats {
  totalWpm: number;
  totalAccuracy: number;
  totalErrors: number;
  count: number;
  // Challenge Mode streak tracking
  challengeStreak: number;
  maxChallengeStreak: number;
  completedInTime: number;
  timedOut: number;
}

export interface ErrorCategory {
  type: 'spelling' | 'punctuation' | 'capitalization' | 'missing' | 'extra' | 'word_order';
  count: number;
  examples: string[];
}

export interface SessionHistoryItem {
  sentence: string;
  typedText: string;
  accuracy: number;
  wpm: number;
  errors: number;
  timestamp: number;
  errorCategories: ErrorCategory[];
}

// ============================================================================
// STREAK & BOOKMARKS
// ============================================================================

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string;
  totalSessions: number;
}

export interface BookmarkedSentence {
  id: number;
  sentence: string;
  category: string;
  difficulty: string;
  bookmarkedAt: number;
  lastAccuracy?: number;
}

// ============================================================================
// COACHING & ACHIEVEMENTS
// ============================================================================

export type CoachingTipType = 'encouragement' | 'improvement' | 'warning' | 'achievement';

export interface CoachingTip {
  type: CoachingTipType;
  message: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

// ============================================================================
// SESSION LENGTH OPTIONS
// ============================================================================

export const SESSION_LENGTH_OPTIONS = [
  { value: 1, label: '1 sentence (Instant)' },
  { value: 2, label: '2 sentences (Very Short)' },
  { value: 3, label: '3 sentences (Warm-up)' },
  { value: 5, label: '5 sentences (Quick)' },
  { value: 10, label: '10 sentences (Standard)' },
  { value: 15, label: '15 sentences (Extended)' },
  { value: 20, label: '20 sentences (Long)' },
  { value: 25, label: '25 sentences (Marathon)' },
  { value: 30, label: '30 sentences (Endurance)' },
  { value: 50, label: '50 sentences (Challenge)' },
  { value: 75, label: '75 sentences (Ultra)' },
  { value: 100, label: '100 sentences (Master)' },
  { value: 0, label: 'Custom...' },
] as const;

export const CATEGORIES = [
  { value: 'all', label: 'All Topics' },
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'culture', label: 'Culture' },
  { value: 'environment', label: 'Environment' },
  { value: 'health', label: 'Health' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education' },
] as const;

// ============================================================================
// MINDFUL ENCOURAGEMENTS
// ============================================================================

export const MINDFUL_ENCOURAGEMENTS = [
  { message: "Breathe deeply. You're doing great.", type: 'calm' },
  { message: "Every word typed is progress made.", type: 'progress' },
  { message: "Stay present. Stay focused.", type: 'focus' },
  { message: "You're in the flow. Keep going.", type: 'flow' },
  { message: "Patience brings perfection.", type: 'patience' },
  { message: "Your focus is your superpower.", type: 'encouragement' },
  { message: "One sentence at a time. You've got this.", type: 'calm' },
  { message: "Listen. Type. Succeed.", type: 'simple' },
  { message: "Each attempt makes you stronger.", type: 'growth' },
  { message: "Embrace the calm. Master the words.", type: 'zen' },
  { message: "Your concentration is impressive.", type: 'praise' },
  { message: "Steady hands, steady mind.", type: 'focus' },
  { message: "Beautiful focus. Beautiful typing.", type: 'encouragement' },
  { message: "You're building something great.", type: 'progress' },
  { message: "The journey of mastery continues.", type: 'growth' },
] as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  STREAK: 'dictation_streak',
  BOOKMARKS: 'dictation_bookmarks',
  VOICE: 'dictation_voice',
  SESSION: 'dictation_session_backup',
  OPENAI_VOICE: 'dictation-openai-voice',
  USE_OPENAI: 'dictation-use-openai',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getDifficultyEmoji = (difficulty: DifficultyLevel) => {
  // Deprecated: Emojis removed for production readiness.
  // This function is kept for backward compatibility but returns empty string.
  return '';
};

export function getNextDifficulty(
  current: DifficultyLevel,
  direction: 'up' | 'down'
): DifficultyLevel {
  const currentIndex = DIFFICULTY_ORDER.indexOf(current);
  if (direction === 'up') {
    return DIFFICULTY_ORDER[Math.min(currentIndex + 1, DIFFICULTY_ORDER.length - 1)];
  } else {
    return DIFFICULTY_ORDER[Math.max(currentIndex - 1, 0)];
  }
}

export function getRandomEncouragement(): string {
  return MINDFUL_ENCOURAGEMENTS[
    Math.floor(Math.random() * MINDFUL_ENCOURAGEMENTS.length)
  ].message;
}

// ============================================================================
// INITIAL STATES
// ============================================================================

export const INITIAL_TEST_STATE: DictationTestState = {
  sentence: null,
  typedText: '',
  startTime: null,
  endTime: null,
  replayCount: 0,
  hintShown: false,
  showHint: false,
  isComplete: false,
  result: null,
  timeLimitMs: null,
  timeExpired: false,
  showTimeUpOverlay: false,
  showTimePreview: false,
};

export const INITIAL_SESSION_STATS: SessionStats = {
  totalWpm: 0,
  totalAccuracy: 0,
  totalErrors: 0,
  count: 0,
  challengeStreak: 0,
  maxChallengeStreak: 0,
  completedInTime: 0,
  timedOut: 0,
};

export const INITIAL_ADAPTIVE_CONFIG: AdaptiveDifficultyConfig = {
  enabled: false,
  currentLevel: 'easy',
  consecutiveHighScores: 0,
  consecutiveLowScores: 0,
  recentScores: [],
};
