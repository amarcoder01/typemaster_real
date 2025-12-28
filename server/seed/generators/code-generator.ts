/**
 * Code Practice Mode Generator
 * Generates realistic code typing test results
 */

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

const PROGRAMMING_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'rust',
  'go',
  'ruby',
  'php',
  'csharp'
] as const;

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export interface CodeResultOptions {
  language?: string;
  difficulty?: string;
}

/**
 * Generate code typing results for a single user
 */
export function generateUserCodeResults(
  user: SeedUser,
  options: CodeResultOptions = {}
): any[] {
  const results: any[] = [];
  
  // Assign user characteristics
  const skillLevel = assignSkillLevel();
  const activityLevel = assignActivityLevel();
  const testCount = Math.floor(generateTestCount(activityLevel) * 0.6); // Less activity in code mode
  
  // Code typing is typically 30-40% slower than prose
  const baseWpm = generateWPM(skillLevel) * 0.65;
  
  // User has a preferred language (70% of tests)
  const preferredLang = options.language || randomChoice(PROGRAMMING_LANGUAGES);
  
  // Generate progressive test dates
  const testDates = generateProgressiveDates(testCount, 60); // Last 60 days
  
  // Generate tests showing improvement over time
  for (let i = 0; i < testCount; i++) {
    // Apply improvement factor
    const wpm = applyImprovementFactor(baseWpm, i, testCount);
    
    // Generate accuracy (code typing has slightly lower accuracy)
    const accuracy = generateAccuracy(wpm, skillLevel) - 2; // 2% penalty for code
    
    // 70% chance of preferred language, 30% chance of random
    const language = Math.random() < 0.7 ? preferredLang : randomChoice(PROGRAMMING_LANGUAGES);
    
    // Random difficulty
    const difficulty = randomChoice(DIFFICULTIES);
    
    const duration = randomChoice([60, 120, 180, 300]); // Test duration in seconds
    const characters = Math.round((wpm * duration) / 60 * 5); // Approximate characters
    const errors = Math.round((100 - accuracy) / 100 * characters);
    
    results.push({
      userId: user.id,
      wpm: Math.round(wpm),
      accuracy: Math.max(85, Math.round(accuracy * 10) / 10),
      programmingLanguage: language,
      difficulty,
      duration,
      characters,
      errors,
      createdAt: testDates[i]
    });
  }
  
  return results;
}

/**
 * Generate code results for multiple users
 */
export function generateCodeResults(users: SeedUser[]): any[] {
  const allResults: any[] = [];
  
  console.log(`Generating code practice results for ${users.length} users...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userResults = generateUserCodeResults(user);
    allResults.push(...userResults);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated results for ${i + 1}/${users.length} users`);
    }
  }
  
  console.log(`Total code results generated: ${allResults.length}`);
  
  return allResults;
}

