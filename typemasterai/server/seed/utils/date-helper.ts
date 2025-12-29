/**
 * Date Helper Utilities
 * Helper functions for generating dates for seed data
 */

/**
 * Get a random date between two dates
 */
export function randomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Get a date N days ago from now
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get a date N hours ago from now
 */
export function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

/**
 * Format date for database insertion
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Check if date is within range
 */
export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Add random variance to a date (±hours)
 */
export function addRandomVariance(date: Date, maxHours: number): Date {
  const variance = (Math.random() - 0.5) * 2 * maxHours;
  const result = new Date(date);
  result.setHours(result.getHours() + variance);
  return result;
}

