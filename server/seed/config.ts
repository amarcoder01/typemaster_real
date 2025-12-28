/**
 * Seed Configuration
 * Central configuration for leaderboard data seeding with realistic distributions
 */

export const SEED_CONFIG = {
  usersPerMode: 150,
  markAsTest: false,
  testUserPrefix: '',
  distributionType: 'realistic' as const,
  
  modes: {
    standard: { enabled: true, priority: 1 },
    code: { enabled: true, priority: 2 },
    dictation: { enabled: true, priority: 3 },
    stress: { enabled: true, priority: 4 },
    rating: { enabled: true, priority: 5 },
    book: { enabled: true, priority: 6 }
  },

  // Prevent accidental production seeding
  safety: {
    requireConfirmation: true,
    allowProduction: false,
    dryRunDefault: false
  }
};

/**
 * WPM Distribution Statistics
 * Based on real-world typing test data from TypingTest.com, Monkeytype, and industry research
 */
export const WPM_DISTRIBUTIONS = {
  beginner: { 
    mean: 35, 
    stdDev: 8, 
    min: 15, 
    max: 50,
    percentage: 0.10 // 10% of users
  },
  intermediate: { 
    mean: 55, 
    stdDev: 10, 
    min: 40, 
    max: 75,
    percentage: 0.30 // 30% of users
  },
  advanced: { 
    mean: 80, 
    stdDev: 12, 
    min: 65, 
    max: 105,
    percentage: 0.40 // 40% of users
  },
  expert: { 
    mean: 110, 
    stdDev: 15, 
    min: 90, 
    max: 140,
    percentage: 0.15 // 15% of users
  },
  elite: { 
    mean: 135, 
    stdDev: 10, 
    min: 120, 
    max: 160,
    percentage: 0.05 // 5% of users
  }
} as const;

export type SkillLevel = keyof typeof WPM_DISTRIBUTIONS;

/**
 * Accuracy ranges by skill level
 * Higher skill = higher accuracy (with slight variance)
 */
export const ACCURACY_RANGES = {
  beginner: { min: 85, max: 92, mean: 88.5 },
  intermediate: { min: 92, max: 96, mean: 94 },
  advanced: { min: 96, max: 98, mean: 97 },
  expert: { min: 97, max: 99.5, mean: 98.5 },
  elite: { min: 97.5, max: 99.8, mean: 98.8 }
} as const;

/**
 * Test activity patterns
 * Realistic distribution of how many tests users complete
 */
export const ACTIVITY_DISTRIBUTION = {
  casual: { min: 1, max: 5, percentage: 0.40 },      // 40% casual
  regular: { min: 5, max: 15, percentage: 0.35 },    // 35% regular
  active: { min: 15, max: 50, percentage: 0.20 },    // 20% active
  power: { min: 50, max: 200, percentage: 0.05 }     // 5% power users
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_DISTRIBUTION;

/**
 * Test modes (duration in seconds)
 */
export const TEST_MODES = [15, 30, 60, 120] as const;

/**
 * Languages for standard tests
 */
export const LANGUAGES = ['en'] as const; // Start with English, expand later

/**
 * Avatar color palette
 */
export const AVATAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500'
] as const;

/**
 * Date range for test creation (days in the past)
 */
export const DATE_RANGE = {
  minDaysAgo: 1,
  maxDaysAgo: 90  // Last 3 months of activity
} as const;

