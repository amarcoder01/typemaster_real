/**
 * Standard Mode Generator
 * Generates realistic test results for standard typing mode
 */

import type { InsertTestResult } from '@shared/schema';
import type { SeedUser } from '../factories/user-factory';
import {
  assignSkillLevel,
  assignActivityLevel,
  generateWPM,
  generateAccuracy,
  generateTestCount,
  generateProgressiveDates,
  randomChoice,
  applyImprovementFactor
} from '../utils/distribution';
import { TEST_MODES, LANGUAGES } from '../config';

export interface StandardResultOptions {
  language?: string;
  freestyle?: boolean;
}

/**
 * Generate test results for a single user
 */
export function generateUserResults(
  user: SeedUser,
  options: StandardResultOptions = {}
): InsertTestResult[] {
  const results: InsertTestResult[] = [];
  
  // Assign user characteristics
  const skillLevel = assignSkillLevel();
  const activityLevel = assignActivityLevel();
  const testCount = generateTestCount(activityLevel);
  
  // Generate base WPM for this user
  const baseWpm = generateWPM(skillLevel);
  
  // Generate progressive test dates
  const testDates = generateProgressiveDates(testCount, 90); // Last 90 days
  
  // Generate tests showing improvement over time
  for (let i = 0; i < testCount; i++) {
    // Apply improvement factor (users get better with practice)
    const wpm = applyImprovementFactor(baseWpm, i, testCount);
    
    // Generate accuracy correlated with WPM and skill
    const accuracy = generateAccuracy(wpm, skillLevel);
    
    // Random test mode (duration)
    const mode = randomChoice(TEST_MODES);
    
    results.push({
      userId: user.id,
      wpm,
      accuracy,
      mode,
      language: options.language || randomChoice(LANGUAGES),
      freestyle: options.freestyle ?? false,
      characters: Math.round(wpm * mode / 60 * 5), // Approximate characters
      errors: Math.round((100 - accuracy) / 100 * Math.round(wpm * mode / 60 * 5)),
      createdAt: testDates[i]
    } as any);
  }
  
  return results;
}

/**
 * Generate results for multiple users
 */
export function generateStandardResults(
  users: SeedUser[],
  options: StandardResultOptions = {}
): InsertTestResult[] {
  const allResults: InsertTestResult[] = [];
  
  console.log(`Generating standard mode results for ${users.length} users...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userResults = generateUserResults(user, options);
    allResults.push(...userResults);
    
    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated results for ${i + 1}/${users.length} users`);
    }
  }
  
  console.log(`Total results generated: ${allResults.length}`);
  
  return allResults;
}

/**
 * Generate results with specific distribution
 * Useful for testing specific scenarios
 */
export function generateCustomResults(
  users: SeedUser[],
  wpmRange: { min: number; max: number },
  options: StandardResultOptions = {}
): InsertTestResult[] {
  const results: InsertTestResult[] = [];
  
  for (const user of users) {
    const activityLevel = assignActivityLevel();
    const testCount = generateTestCount(activityLevel);
    const testDates = generateProgressiveDates(testCount, 90);
    
    for (let i = 0; i < testCount; i++) {
      // Generate WPM within specified range
      const wpm = Math.floor(
        wpmRange.min + Math.random() * (wpmRange.max - wpmRange.min)
      );
      
      // Generate realistic accuracy for this WPM
      const accuracy = 95 + Math.random() * 4; // 95-99%
      
      const mode = randomChoice(TEST_MODES);
      results.push({
        userId: user.id,
        wpm,
        accuracy: Math.round(accuracy * 10) / 10,
        mode,
        language: options.language || randomChoice(LANGUAGES),
        freestyle: options.freestyle ?? false,
        characters: Math.round(wpm * mode / 60 * 5),
        errors: Math.round((100 - accuracy) / 100 * Math.round(wpm * mode / 60 * 5)),
        createdAt: testDates[i]
      } as any);
    }
  }
  
  return results;
}

/**
 * Get statistics about generated results
 */
export function getResultStats(results: InsertTestResult[]) {
  if (results.length === 0) {
    return {
      count: 0,
      avgWpm: 0,
      minWpm: 0,
      maxWpm: 0,
      avgAccuracy: 0
    };
  }
  
  const wpms = results.map(r => r.wpm);
  const accuracies = results.map(r => r.accuracy);
  
  return {
    count: results.length,
    avgWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
    minWpm: Math.min(...wpms),
    maxWpm: Math.max(...wpms),
    avgAccuracy: Math.round(
      (accuracies.reduce((a, b) => a + b, 0) / accuracies.length) * 10
    ) / 10
  };
}

