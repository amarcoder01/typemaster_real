/**
 * Name Generator Utility
 * Generates realistic, unique usernames from curated name lists
 */

import nameData from '../data/names.json';
import { SEED_CONFIG } from '../config';

// Track generated names to ensure uniqueness
const generatedNames = new Set<string>();

/**
 * Get random element from array
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get a random first name from all categories
 */
function getRandomFirstName(): string {
  const allCategories = Object.values(nameData.firstNames);
  const allNames = allCategories.flat();
  return randomChoice(allNames);
}

/**
 * Get a random descriptor from all categories
 */
function getRandomDescriptor(): string {
  const allCategories = Object.values(nameData.descriptors);
  const allDescriptors = allCategories.flat();
  return randomChoice(allDescriptors);
}

/**
 * Get a specific type of descriptor
 */
function getTypedDescriptor(type: keyof typeof nameData.descriptors): string {
  return randomChoice(nameData.descriptors[type]);
}

/**
 * Generate a username based on a style template
 */
function generateFromTemplate(template: string): string {
  let result = template;

  // Replace {firstName} with random first name
  if (result.includes('{firstName}')) {
    result = result.replace('{firstName}', getRandomFirstName());
  }

  // Replace {Descriptor} with capitalized descriptor
  if (result.includes('{Descriptor}')) {
    result = result.replace('{Descriptor}', capitalize(getRandomDescriptor()));
  }

  // Replace {descriptor} with lowercase descriptor
  if (result.includes('{descriptor}')) {
    result = result.replace('{descriptor}', getRandomDescriptor().toLowerCase());
  }

  // Replace {Skill} with skill descriptor
  if (result.includes('{Skill}')) {
    result = result.replace('{Skill}', getTypedDescriptor('skill'));
  }

  // Replace {Typing} with typing descriptor
  if (result.includes('{Typing}')) {
    result = result.replace('{Typing}', getTypedDescriptor('typing'));
  }

  // Replace {Master} with suffix
  if (result.includes('{Master}')) {
    result = result.replace('{Master}', randomChoice(nameData.suffixes));
  }

  // Replace {Animal} with animal descriptor
  if (result.includes('{Animal}')) {
    result = result.replace('{Animal}', getTypedDescriptor('animals'));
  }

  // Replace {Nature} with nature descriptor
  if (result.includes('{Nature}')) {
    result = result.replace('{Nature}', getTypedDescriptor('nature'));
  }

  // Replace {Typer} with "Typer"
  if (result.includes('{Typer}')) {
    result = result.replace('{Typer}', 'Typer');
  }

  // Replace {Number} with random 1-3 digit number
  if (result.includes('{Number}')) {
    const number = randomInt(1, 999);
    result = result.replace('{Number}', number.toString());
  }

  return result;
}

/**
 * Clean and validate username
 */
function cleanUsername(username: string): string {
  // Remove any special characters except underscore and dash
  let cleaned = username.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Ensure it starts with a letter or number
  if (!/^[a-zA-Z0-9]/.test(cleaned)) {
    cleaned = 'User' + cleaned;
  }

  // Limit length to 20 characters
  if (cleaned.length > 20) {
    cleaned = cleaned.substring(0, 20);
  }

  // Minimum length of 3
  if (cleaned.length < 3) {
    cleaned = cleaned + randomInt(10, 99);
  }

  return cleaned;
}

/**
 * Generate a unique username
 */
export function generateUsername(): string {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    // Pick a random style template
    const template = randomChoice(nameData.styles);
    
    // Generate from template
    let username = generateFromTemplate(template);
    
    // Clean and validate
    username = cleanUsername(username);

    // Add test prefix if configured
    if (SEED_CONFIG.markAsTest) {
      username = SEED_CONFIG.testUserPrefix + username;
    }

    // Check uniqueness
    if (!generatedNames.has(username)) {
      generatedNames.add(username);
      return username;
    }

    attempts++;
  }

  // Fallback: use timestamp-based unique name
  const timestamp = Date.now();
  const fallback = `${SEED_CONFIG.testUserPrefix}User_${timestamp}`;
  generatedNames.add(fallback);
  return fallback;
}

/**
 * Generate multiple unique usernames
 */
export function generateUsernames(count: number): string[] {
  const usernames: string[] = [];
  
  for (let i = 0; i < count; i++) {
    usernames.push(generateUsername());
  }
  
  return usernames;
}

/**
 * Reset the generated names cache
 * Useful for testing or starting fresh
 */
export function resetNameCache(): void {
  generatedNames.clear();
}

/**
 * Get statistics about generated names
 */
export function getNameStats() {
  return {
    totalGenerated: generatedNames.size,
    sampleNames: Array.from(generatedNames).slice(0, 10)
  };
}

