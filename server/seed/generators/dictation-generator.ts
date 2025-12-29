/**
 * Dictation Mode Generator
 * Generates realistic dictation test results
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

const SPEEDS = ['slow', 'normal', 'fast'] as const;

/**
 * Generate dictation results for a single user
 */
export function generateUserDictationResults(user: SeedUser): any[] {
  const results: any[] = [];
  
  // Assign user characteristics
  const skillLevel = assignSkillLevel();
  const activityLevel = assignActivityLevel();
  const testCount = Math.floor(generateTestCount(activityLevel) * 0.3); // Less activity in dictation
  
  // Dictation typing is about 40-50% slower (listening + typing)
  const baseWpm = generateWPM(skillLevel) * 0.55;
  
  // Generate progressive test dates
  const testDates = generateProgressiveDates(testCount, 60);
  
  // Generate tests showing improvement
  for (let i = 0; i < testCount; i++) {
    // Apply improvement factor
    const wpm = applyImprovementFactor(baseWpm, i, testCount);
    
    // Generate accuracy (dictation has higher accuracy - you hear it correctly)
    const accuracy = Math.min(99.5, generateAccuracy(wpm, skillLevel) + 1);
    
    // Random speed (users gradually try faster speeds)
    const speedRoll = Math.random() + (i / testCount) * 0.3; // Bias towards faster as they improve
    const speedLevel = speedRoll < 0.4 ? 'slow' : speedRoll < 0.75 ? 'normal' : 'fast';
    
    // Actual speed multiplier based on speed level
    const actualSpeed = speedLevel === 'slow' ? 0.7 : speedLevel === 'normal' ? 1.0 : 1.3;
    
    // Duration in seconds
    const duration = randomChoice([60, 120, 180]);
    
    const characters = Math.round((wpm * duration) / 60 * 5);
    const errors = Math.round((100 - accuracy) / 100 * characters);
    
    // Generate realistic sentence and typed text
    const actualSentence = generateSampleSentence(characters);
    const typedText = generateTypedText(actualSentence, accuracy);
    
    // Replay count (lower for higher skill)
    const replayCount = skillLevel === 'beginner' 
      ? Math.floor(Math.random() * 3) 
      : skillLevel === 'intermediate' 
      ? Math.floor(Math.random() * 2) 
      : Math.random() < 0.2 ? 1 : 0;
    
    // Hint used (less likely for higher skill)
    const hintUsed = skillLevel === 'beginner' 
      ? Math.random() < 0.4 ? 1 : 0
      : skillLevel === 'intermediate' 
      ? Math.random() < 0.2 ? 1 : 0
      : Math.random() < 0.05 ? 1 : 0;
    
    results.push({
      userId: user.id,
      sentenceId: Math.floor(Math.random() * 100) + 1, // Random sentence ID 1-100
      speedLevel,
      actualSpeed,
      actualSentence,
      typedText,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      errors,
      replayCount,
      hintUsed,
      duration,
      createdAt: testDates[i]
    });
  }
  
  return results;
}

/**
 * Generate a sample sentence with approximately the given number of characters
 */
function generateSampleSentence(targetChars: number): string {
  const words = [
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
    'typing', 'practice', 'makes', 'perfect', 'speed', 'accuracy',
    'keyboard', 'skills', 'improve', 'daily', 'exercise', 'focus'
  ];
  
  let sentence = '';
  while (sentence.length < targetChars) {
    const word = words[Math.floor(Math.random() * words.length)];
    sentence += (sentence.length > 0 ? ' ' : '') + word;
  }
  
  return sentence.slice(0, targetChars);
}

/**
 * Generate typed text with errors based on accuracy
 */
function generateTypedText(original: string, accuracy: number): string {
  if (accuracy >= 99) return original;
  
  const chars = original.split('');
  const errorCount = Math.round((100 - accuracy) / 100 * chars.length);
  
  // Introduce random errors
  for (let i = 0; i < errorCount; i++) {
    const pos = Math.floor(Math.random() * chars.length);
    // Replace with a random character
    chars[pos] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  }
  
  return chars.join('');
}

/**
 * Generate dictation results for multiple users
 */
export function generateDictationResults(users: SeedUser[]): any[] {
  const allResults: any[] = [];
  
  console.log(`Generating dictation results for ${users.length} users...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userResults = generateUserDictationResults(user);
    allResults.push(...userResults);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Generated results for ${i + 1}/${users.length} users`);
    }
  }
  
  console.log(`Total dictation results generated: ${allResults.length}`);
  
  return allResults;
}

