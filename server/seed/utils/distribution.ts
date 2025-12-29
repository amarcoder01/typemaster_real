/**
 * Statistical Distribution Utilities
 * Provides functions for generating realistic data distributions
 */

import { 
  WPM_DISTRIBUTIONS, 
  ACCURACY_RANGES, 
  ACTIVITY_DISTRIBUTION,
  SkillLevel,
  ActivityLevel 
} from '../config';

/**
 * Box-Muller transform for normal distribution
 * Generates numbers following a normal (Gaussian) distribution
 */
export function normalDistribution(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Assign a skill level based on realistic distribution
 * 10% beginners, 30% intermediate, 40% advanced, 15% expert, 5% elite
 */
export function assignSkillLevel(): SkillLevel {
  const rand = Math.random();
  
  let cumulative = 0;
  for (const [level, config] of Object.entries(WPM_DISTRIBUTIONS)) {
    cumulative += config.percentage;
    if (rand < cumulative) {
      return level as SkillLevel;
    }
  }
  
  return 'advanced'; // Fallback (should never reach here)
}

/**
 * Assign an activity level based on realistic distribution
 */
export function assignActivityLevel(): ActivityLevel {
  const rand = Math.random();
  
  let cumulative = 0;
  for (const [level, config] of Object.entries(ACTIVITY_DISTRIBUTION)) {
    cumulative += config.percentage;
    if (rand < cumulative) {
      return level as ActivityLevel;
    }
  }
  
  return 'regular'; // Fallback
}

/**
 * Generate WPM value for a given skill level
 */
export function generateWPM(skillLevel: SkillLevel): number {
  const dist = WPM_DISTRIBUTIONS[skillLevel];
  const wpm = normalDistribution(dist.mean, dist.stdDev);
  const clamped = clamp(wpm, dist.min, dist.max);
  return Math.round(clamped);
}

/**
 * Generate accuracy correlated with WPM
 * Higher WPM typically means slightly lower accuracy (speed-accuracy tradeoff)
 * But still constrained by skill level
 */
export function generateAccuracy(wpm: number, skillLevel: SkillLevel): number {
  const range = ACCURACY_RANGES[skillLevel];
  
  // Base accuracy from skill level
  let accuracy = normalDistribution(range.mean, 1.5);
  
  // Apply WPM penalty for very high speeds
  const wpmConfig = WPM_DISTRIBUTIONS[skillLevel];
  const wpmRatio = wpm / wpmConfig.mean;
  
  if (wpmRatio > 1.2) {
    // Typing significantly faster than average for skill level
    // Apply small accuracy penalty
    accuracy -= (wpmRatio - 1.2) * 2;
  }
  
  // Clamp to skill level range
  accuracy = clamp(accuracy, range.min, range.max);
  
  return roundTo(accuracy, 1);
}

/**
 * Generate number of tests for a user based on activity level
 */
export function generateTestCount(activityLevel: ActivityLevel): number {
  const dist = ACTIVITY_DISTRIBUTION[activityLevel];
  
  // Use weighted distribution within range
  // More likely to be in the middle of the range
  const mid = (dist.min + dist.max) / 2;
  const spread = (dist.max - dist.min) / 4;
  
  let count = normalDistribution(mid, spread);
  count = clamp(count, dist.min, dist.max);
  
  return Math.round(count);
}

/**
 * Generate a random date within the past N days
 */
export function randomDateInPast(maxDaysAgo: number): Date {
  const now = Date.now();
  const daysAgo = Math.random() * maxDaysAgo;
  const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000);
  
  return new Date(timestamp);
}

/**
 * Generate dates with realistic distribution
 * More recent tests are more likely (users are more active recently)
 */
export function generateRecentBiasedDate(maxDaysAgo: number): Date {
  // Use exponential distribution to favor recent dates
  const lambda = 2 / maxDaysAgo; // Rate parameter
  const u = Math.random();
  const daysAgo = -Math.log(1 - u) / lambda;
  
  // Clamp to max days
  const clampedDays = Math.min(daysAgo, maxDaysAgo);
  
  const now = Date.now();
  const timestamp = now - (clampedDays * 24 * 60 * 60 * 1000);
  
  return new Date(timestamp);
}

/**
 * Generate test dates with progression
 * Earlier tests are older, later tests are more recent
 * Simulates a user's journey over time
 */
export function generateProgressiveDates(
  count: number,
  maxDaysAgo: number
): Date[] {
  const dates: Date[] = [];
  const now = Date.now();
  
  // Handle edge case for single test
  if (count === 1) {
    return [new Date(now - (maxDaysAgo / 2 * 24 * 60 * 60 * 1000))];
  }
  
  for (let i = 0; i < count; i++) {
    // First test is oldest, last test is most recent
    const progress = i / Math.max(count - 1, 1); // 0 to 1, avoid division by zero
    
    // Use progress with some randomness
    const daysAgo = maxDaysAgo * (1 - progress) * (0.7 + Math.random() * 0.3);
    
    const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000);
    
    // Validate timestamp
    if (isNaN(timestamp) || timestamp < 0) {
      console.warn(`Invalid timestamp generated: ${timestamp}, using current time`);
      dates.push(new Date(now));
    } else {
      dates.push(new Date(timestamp));
    }
  }
  
  // Sort chronologically
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Random choice from array
 */
export function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Weighted random choice
 * Higher weights = higher probability
 */
export function weightedRandom(min: number, max: number): number {
  // Use triangular distribution favoring middle values
  const u = Math.random();
  const v = Math.random();
  const avg = (u + v) / 2;
  
  return Math.floor(min + avg * (max - min + 1));
}

/**
 * Generate skill distribution for a batch of users
 * Returns array of skill levels matching configured percentages
 */
export function generateSkillDistribution(count: number): SkillLevel[] {
  const distribution: SkillLevel[] = [];
  
  for (const [level, config] of Object.entries(WPM_DISTRIBUTIONS)) {
    const userCount = Math.round(count * config.percentage);
    for (let i = 0; i < userCount; i++) {
      distribution.push(level as SkillLevel);
    }
  }
  
  // Fill any remainder with 'advanced' (due to rounding)
  while (distribution.length < count) {
    distribution.push('advanced');
  }
  
  // Shuffle to randomize order
  return shuffleArray(distribution);
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate improvement over time
 * Users generally get better with practice
 */
export function applyImprovementFactor(
  baseWpm: number,
  testNumber: number,
  totalTests: number
): number {
  // Calculate progress (0 to 1)
  const progress = testNumber / totalTests;
  
  // Improvement curve: logarithmic (fast improvement early, plateaus later)
  const improvementPercent = Math.log(1 + progress * 9) / Math.log(10);
  
  // Apply improvement (up to 20% increase)
  const improvedWpm = baseWpm * (1 + improvementPercent * 0.2);
  
  // Add some randomness (±5%)
  const variance = 0.95 + Math.random() * 0.1;
  
  return Math.round(improvedWpm * variance);
}

