/**
 * Scheduler for Leaderboard Cache Refresh Job
 * Automatically refreshes materialized views every 5 minutes
 */

import { refreshLeaderboardViews, checkMaterializedViewsExist } from './refresh-leaderboard-cache.js';

let refreshInterval: NodeJS.Timeout | null = null;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start the leaderboard cache refresh scheduler
 */
export async function startLeaderboardRefreshScheduler(): Promise<void> {
  // Check if materialized views exist before starting
  const viewsExist = await checkMaterializedViewsExist();
  
  if (!viewsExist) {
    console.warn('[Leaderboard Scheduler] Materialized views not found. Please run migration 003_create_leaderboard_materialized_views.sql');
    console.warn('[Leaderboard Scheduler] Scheduler will not start until views are created.');
    return;
  }

  // Stop existing job if running
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Schedule refresh every 5 minutes
  refreshInterval = setInterval(async () => {
    try {
      await refreshLeaderboardViews();
    } catch (error) {
      console.error('[Leaderboard Scheduler] Failed to refresh views:', error);
    }
  }, REFRESH_INTERVAL_MS);

  console.log('[Leaderboard Scheduler] Started - refreshing materialized views every 5 minutes');

  // Run initial refresh
  try {
    await refreshLeaderboardViews();
  } catch (error) {
    console.error('[Leaderboard Scheduler] Initial refresh failed:', error);
  }
}

/**
 * Stop the leaderboard cache refresh scheduler
 */
export function stopLeaderboardRefreshScheduler(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('[Leaderboard Scheduler] Stopped');
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  running: boolean;
  intervalMs: number;
} {
  return {
    running: refreshInterval !== null,
    intervalMs: REFRESH_INTERVAL_MS,
  };
}

