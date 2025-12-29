/**
 * Book Library Mode Generator
 * Generates realistic book typing test results
 */

import type { SeedUser } from '../factories/user-factory';
import {
  assignSkillLevel,
  assignActivityLevel,
  generateWPM,
  generateAccuracy,
  generateTestCount,
  generateProgressiveDates,
  randomInt,
  applyImprovementFactor
} from '../utils/distribution';

/**
 * Generate book typing results for a single user
 */
export function generateUserBookResults(user: SeedUser): any[] {
  const results: any[] = [];
  
  // Assign user characteristics
  const skillLevel = assignSkillLevel();
  const activityLevel = assignActivityLevel();
  const testCount = Math.floor(generateTestCount(activityLevel) * 0.5); // Moderate activity
  
  // Base WPM (book typing is similar to standard)
  const baseWpm = generateWPM(skillLevel);
  
  // Generate progressive test dates
  const testDates = generateProgressiveDates(testCount, 90);
  
  // User might focus on specific paragraphs from different books
  const favoriteParagraphIds = [
    randomInt(1, 100),
    randomInt(1, 100),
    randomInt(1, 100)
  ];
  
  // Generate tests showing improvement
  for (let i = 0; i < testCount; i++) {
    // Apply improvement factor
    const wpm = applyImprovementFactor(baseWpm, i, testCount);
    
    // Generate accuracy
    const accuracy = generateAccuracy(wpm, skillLevel);
    
    // 60% chance of favorite paragraph, 40% chance of random
    const paragraphId = Math.random() < 0.6 
      ? favoriteParagraphIds[Math.floor(Math.random() * favoriteParagraphIds.length)]
      : randomInt(1, 100);
    
    // Duration in seconds (30 seconds to 5 minutes)
    const duration = randomInt(30, 300);
    
    // Calculate characters based on WPM and duration
    // Average word length is ~5 characters
    const characters = Math.round((wpm * duration) / 60 * 5);
    
    // Calculate errors based on accuracy
    const errors = Math.round((100 - accuracy) / 100 * characters);
    
    results.push({
      userId: user.id,
      paragraphId,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      characters,
      errors,
      duration,
      createdAt: testDates[i]
    });
  }
  
  return results;
}

/**
 * Generate book results for multiple users
 */
export function generateBookResults(users: SeedUser[]): any[] {
  const allResults: any[] = [];
  
  console.log(`Generating book library results for ${users.length} users...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userResults = generateUserBookResults(user);
    allResults.push(...userResults);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated results for ${i + 1}/${users.length} users`);
    }
  }
  
  console.log(`Total book results generated: ${allResults.length}`);
  
  return allResults;
}


