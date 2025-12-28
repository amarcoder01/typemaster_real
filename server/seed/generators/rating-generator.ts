/**
 * Competitive Racing (Rating) Mode Generator
 * Generates realistic racing ratings using ELO system
 */

import type { SeedUser } from '../factories/user-factory';
import {
  assignSkillLevel,
  assignActivityLevel,
  generateWPM,
  generateTestCount
} from '../utils/distribution';

const STARTING_RATING = 1000;

// Tier thresholds
const TIERS = {
  bronze: { min: 0, max: 999 },
  silver: { min: 1000, max: 1399 },
  gold: { min: 1400, max: 1799 },
  platinum: { min: 1800, max: 2199 },
  diamond: { min: 2200, max: Infinity }
} as const;

/**
 * Calculate final rating based on skill level
 */
function calculateFinalRating(skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'elite', baseWpm: number): number {
  // Map skill level to rating range
  const ratingRanges = {
    beginner: { min: 800, max: 1100 },
    intermediate: { min: 1100, max: 1400 },
    advanced: { min: 1400, max: 1750 },
    expert: { min: 1750, max: 2100 },
    elite: { min: 2100, max: 2500 }
  };
  
  const range = ratingRanges[skillLevel];
  
  // Add some randomness within the range
  const rating = range.min + Math.random() * (range.max - range.min);
  
  return Math.round(rating);
}

/**
 * Determine tier from rating
 */
function getTier(rating: number): string {
  if (rating >= TIERS.diamond.min) return 'diamond';
  if (rating >= TIERS.platinum.min) return 'platinum';
  if (rating >= TIERS.gold.min) return 'gold';
  if (rating >= TIERS.silver.min) return 'silver';
  return 'bronze';
}

/**
 * Generate rating data for a single user
 */
export function generateUserRating(user: SeedUser): any {
  // Assign user characteristics
  const skillLevel = assignSkillLevel();
  const activityLevel = assignActivityLevel();
  const raceCount = Math.floor(generateTestCount(activityLevel) * 1.5); // More races
  
  // Base WPM
  const baseWpm = generateWPM(skillLevel);
  
  // Calculate final rating based on skill
  const rating = calculateFinalRating(skillLevel, baseWpm);
  const tier = getTier(rating);
  
  // Win rate correlates with skill (better players win more)
  const baseWinRate = 0.3 + (rating - 800) / 1700 * 0.4; // 30% to 70%
  const winRate = Math.min(0.80, Math.max(0.20, baseWinRate + (Math.random() - 0.5) * 0.15));
  
  const wins = Math.round(raceCount * winRate);
  const losses = raceCount - wins;
  
  return {
    userId: user.id,
    rating: Math.round(rating),
    tier,
    wins,
    losses,
    totalRaces: raceCount,
    winRate: Math.round(winRate * 100),
    peakRating: Math.round(rating * (1 + Math.random() * 0.1)), // Peak is slightly higher
    createdAt: user.createdAt,
    updatedAt: new Date()
  };
}

/**
 * Generate ratings for multiple users
 */
export function generateRatings(users: SeedUser[]): any[] {
  const allRatings: any[] = [];
  
  console.log(`Generating competitive racing ratings for ${users.length} users...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const rating = generateUserRating(user);
    allRatings.push(rating);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated ratings for ${i + 1}/${users.length} users`);
    }
  }
  
  console.log(`Total ratings generated: ${allRatings.length}`);
  
  return allRatings;
}

