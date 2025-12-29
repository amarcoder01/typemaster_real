/**
 * Speed Challenge (Stress Test) Mode Generator
 * Generates realistic stress test results
 */

import type { SeedUser } from '../factories/user-factory';
import {
  assignSkillLevel,
  assignActivityLevel,
  generateWPM,
  generateTestCount,
  generateProgressiveDates,
  randomChoice,
  applyImprovementFactor
} from '../utils/distribution';

const DIFFICULTIES = ['beginner', 'intermediate', 'expert', 'nightmare', 'impossible'] as const;
type Difficulty = typeof DIFFICULTIES[number];

/**
 * Calculate score based on WPM and survival time
 */
function calculateScore(wpm: number, survivalTime: number, difficulty: Difficulty): number {
  const difficultyMultiplier = {
    beginner: 1.0,
    intermediate: 1.5,
    expert: 2.0,
    nightmare: 2.5,
    impossible: 3.0
  }[difficulty];
  
  // Score = WPM * survival time * difficulty multiplier
  return Math.round(wpm * survivalTime * difficultyMultiplier);
}

/**
 * Generate stress test results for a single user
 * Note: Due to unique constraint on (user_id, difficulty), each user can only have ONE record per difficulty
 */
export function generateUserStressResults(user: SeedUser): any[] {
  const results: any[] = [];
  
  // Assign user characteristics
  const skillLevel = assignSkillLevel();
  const activityLevel = assignActivityLevel();
  
  // Base WPM for this user
  const baseWpm = generateWPM(skillLevel);
  
  // Determine which difficulties this user has attempted (based on activity level)
  const difficultiesToAttempt: Difficulty[] = [];
  
  // Everyone tries beginner
  difficultiesToAttempt.push('beginner');
  
  // Regular+ users try intermediate
  if (activityLevel !== 'casual') {
    difficultiesToAttempt.push('intermediate');
  }
  
  // Active+ users try expert
  if (activityLevel === 'active' || activityLevel === 'power') {
    difficultiesToAttempt.push('expert');
  }
  
  // Power users try nightmare and impossible
  if (activityLevel === 'power') {
    if (Math.random() < 0.6) difficultiesToAttempt.push('nightmare');
    if (Math.random() < 0.3) difficultiesToAttempt.push('impossible');
  }
  
  // Generate progressive test dates
  const testDates = generateProgressiveDates(difficultiesToAttempt.length, 60);
  
  // Generate one test per difficulty
  difficultiesToAttempt.forEach((difficulty, i) => {
    // WPM improves with each attempt
    const wpm = applyImprovementFactor(baseWpm, i, difficultiesToAttempt.length);
    
    // Survival time based on skill and difficulty
    const baseSurvival = {
      beginner: 150,
      intermediate: 120,
      expert: 90,
      nightmare: 60,
      impossible: 40
    }[difficulty];
    
    // Better players survive longer
    const skillMultiplier = wpm / 80; // Normalized around 80 WPM
    const survivalTime = Math.max(10, Math.round(baseSurvival * skillMultiplier * (0.8 + Math.random() * 0.4)));
    
    // Calculate score
    const score = calculateScore(Math.round(wpm), survivalTime, difficulty);
    
    // Calculate accuracy (stress tests have slightly lower accuracy)
    const accuracy = 92 + Math.random() * 6; // 92-98%
    const totalCharacters = Math.round((wpm * survivalTime) / 60 * 5);
    const totalErrors = Math.round((100 - accuracy) / 100 * totalCharacters);
    
    // Duration is the same as survival time for stress tests
    const duration = survivalTime;
    
    // Max combo based on skill level
    const maxCombo = Math.round(wpm * 0.5 + Math.random() * 20);
    
    // Completion rate (higher for easier difficulties and better players)
    const baseCompletionRate = {
      beginner: 90,
      intermediate: 75,
      expert: 60,
      nightmare: 45,
      impossible: 30
    }[difficulty];
    const completionRate = Math.min(100, baseCompletionRate + (skillMultiplier - 1) * 15 + Math.random() * 10);
    
    results.push({
      userId: user.id,
      difficulty,
      stressScore: score,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      survivalTime,
      duration,
      totalCharacters,
      errors: totalErrors,
      maxCombo,
      completionRate: Math.round(completionRate * 10) / 10,
      enabledEffects: [], // No special effects for seed data
      createdAt: testDates[i]
    });
  });
  
  return results;
}

/**
 * Generate stress test results for multiple users
 */
export function generateStressResults(users: SeedUser[]): any[] {
  const allResults: any[] = [];
  
  console.log(`Generating speed challenge results for ${users.length} users...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userResults = generateUserStressResults(user);
    allResults.push(...userResults);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated results for ${i + 1}/${users.length} users`);
    }
  }
  
  console.log(`Total stress test results generated: ${allResults.length}`);
  
  return allResults;
}

