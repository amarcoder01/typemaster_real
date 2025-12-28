/**
 * Leaderboard Cache Refresh Job
 * Refreshes materialized views periodically for optimal performance
 */

import { db } from '../storage.js';
import { sql } from 'drizzle-orm';

/**
 * Refresh all leaderboard materialized views
 * Uses CONCURRENTLY to avoid locking the views during refresh
 */
export async function refreshLeaderboardViews(): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('[Leaderboard Cache] Starting materialized view refresh...');
    
    // Refresh views concurrently to avoid blocking reads
    // Note: CONCURRENTLY requires unique indexes on the materialized views
    await Promise.all([
      db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_global`),
      db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_daily`),
      db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_weekly`),
      db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_monthly`),
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`[Leaderboard Cache] Successfully refreshed all views in ${duration}ms`);
  } catch (error) {
    console.error('[Leaderboard Cache] Error refreshing materialized views:', error);
    throw error;
  }
}

/**
 * Refresh a specific leaderboard view
 */
export async function refreshSpecificView(viewName: 'global' | 'daily' | 'weekly' | 'monthly'): Promise<void> {
  const fullViewName = `mv_leaderboard_${viewName}`;
  
  try {
    console.log(`[Leaderboard Cache] Refreshing ${fullViewName}...`);
    await db.execute(sql.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${fullViewName}`));
    console.log(`[Leaderboard Cache] Successfully refreshed ${fullViewName}`);
  } catch (error) {
    console.error(`[Leaderboard Cache] Error refreshing ${fullViewName}:`, error);
    throw error;
  }
}

/**
 * Check if materialized views exist
 */
export async function checkMaterializedViewsExist(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM pg_matviews
      WHERE matviewname IN (
        'mv_leaderboard_global',
        'mv_leaderboard_daily',
        'mv_leaderboard_weekly',
        'mv_leaderboard_monthly'
      )
    `);
    
    const count = (result.rows[0] as any)?.count || 0;
    return count === 4;
  } catch (error) {
    console.error('[Leaderboard Cache] Error checking materialized views:', error);
    return false;
  }
}

/**
 * Get materialized view statistics
 */
export async function getMaterializedViewStats(): Promise<Array<{
  viewName: string;
  rowCount: number;
  lastRefresh: Date | null;
  sizeBytes: number;
}>> {
  try {
    const result = await db.execute(sql`
      SELECT 
        schemaname || '.' || matviewname as view_name,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || matviewname)) as size,
        pg_total_relation_size(schemaname || '.' || matviewname) as size_bytes
      FROM pg_matviews
      WHERE matviewname LIKE 'mv_leaderboard_%'
      ORDER BY matviewname
    `);
    
    return result.rows.map((row: any) => ({
      viewName: row.view_name,
      rowCount: 0, // Would need separate query to get exact count
      lastRefresh: null, // PostgreSQL doesn't track this by default
      sizeBytes: parseInt(row.size_bytes) || 0,
    }));
  } catch (error) {
    console.error('[Leaderboard Cache] Error getting view stats:', error);
    return [];
  }
}

// Export for use in scheduled jobs
export const leaderboardCacheJob = {
  name: 'refresh-leaderboard-cache',
  schedule: '*/5 * * * *', // Every 5 minutes
  handler: refreshLeaderboardViews,
};

