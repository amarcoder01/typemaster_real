/**
 * User Factory
 * Creates seed users for leaderboard testing
 */

import crypto from 'node:crypto';
import { generateUsername } from '../utils/name-generator';
import { randomChoice, randomDateInPast } from '../utils/distribution';
import { SEED_CONFIG, AVATAR_COLORS, DATE_RANGE } from '../config';
import type { InsertUser } from '@shared/schema';

export interface SeedUser {
  id: string;
  username: string;
  email: string;
  password: string; // Will be hashed
  avatarColor: string;
  isTestData: boolean;
  createdAt: Date;
}

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  return crypto.randomUUID();
}

/**
 * Hash password (simple hash for test data - not for production)
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Create a single seed user
 */
export function createSeedUser(options: {
  username?: string;
  createdAt?: Date;
} = {}): SeedUser {
  const username = options.username || generateUsername();
  
  return {
    id: generateUserId(),
    username,
    email: `${username}@typemaster.test`,
    password: hashPassword('demo_password_123'), // Same password for all test users
    avatarColor: randomChoice(AVATAR_COLORS),
    isTestData: SEED_CONFIG.markAsTest,
    createdAt: options.createdAt || randomDateInPast(DATE_RANGE.maxDaysAgo)
  };
}

/**
 * Create multiple seed users
 */
export function createSeedUsers(count: number): SeedUser[] {
  const users: SeedUser[] = [];
  
  // Generate users with staggered creation dates (simulate platform growth)
  const sortedDates = generateStaggeredDates(count, DATE_RANGE.maxDaysAgo);
  
  for (let i = 0; i < count; i++) {
    const user = createSeedUser({
      createdAt: sortedDates[i]
    });
    users.push(user);
  }
  
  return users;
}

/**
 * Generate staggered creation dates
 * Simulates organic platform growth (more recent users)
 */
function generateStaggeredDates(count: number, maxDaysAgo: number): Date[] {
  const dates: Date[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    // Use power distribution to favor recent dates
    // Earlier users (lower i) are older, later users are newer
    const progress = i / Math.max(count, 1);
    const power = Math.pow(progress, 2); // Quadratic - more recent users
    
    const daysAgo = maxDaysAgo * (1 - power);
    const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000);
    
    // Add some randomness (±12 hours)
    const variance = (Math.random() - 0.5) * 24 * 60 * 60 * 1000;
    
    const finalTimestamp = timestamp + variance;
    
    // Validate timestamp
    if (isNaN(finalTimestamp) || finalTimestamp < 0) {
      console.warn(`Invalid timestamp generated for user ${i}, using current time`);
      dates.push(new Date(now));
    } else {
      dates.push(new Date(finalTimestamp));
    }
  }
  
  // Sort chronologically (oldest first)
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Convert SeedUser to InsertUser format for database
 */
export function toInsertUser(seedUser: SeedUser): any {
  return {
    id: seedUser.id,
    username: seedUser.username,
    email: seedUser.email,
    password: seedUser.password,
    avatarColor: seedUser.avatarColor,
    isTestData: seedUser.isTestData,
    createdAt: seedUser.createdAt,
    emailVerified: false,
    isActive: true,
    timezone: 'UTC',
    currentStreak: 0,
    bestStreak: 0
  };
}

/**
 * Batch create users for database insertion
 */
export function createUserBatch(count: number): InsertUser[] {
  const seedUsers = createSeedUsers(count);
  return seedUsers.map(toInsertUser);
}

