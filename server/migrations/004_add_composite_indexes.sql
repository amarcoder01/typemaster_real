-- Add composite and covering indexes for leaderboard performance optimization

-- Composite index for leaderboard queries (language + wpm + created_at)
-- This is a covering index that includes all columns needed for ranking
CREATE INDEX IF NOT EXISTS idx_test_results_leaderboard_composite 
ON test_results(language, wpm DESC, created_at DESC) 
WHERE (freestyle = false OR freestyle IS NULL);

-- Composite index for user's best score lookup
CREATE INDEX IF NOT EXISTS idx_test_results_user_language_wpm 
ON test_results(user_id, language, wpm DESC, created_at DESC)
WHERE (freestyle = false OR freestyle IS NULL);

-- Composite index for timeframe-based queries
CREATE INDEX IF NOT EXISTS idx_test_results_timeframe_leaderboard 
ON test_results(created_at DESC, language, wpm DESC)
WHERE (freestyle = false OR freestyle IS NULL);

-- Composite index for counting distinct users per language
CREATE INDEX IF NOT EXISTS idx_test_results_user_language_count
ON test_results(language, user_id)
WHERE (freestyle = false OR freestyle IS NULL);

-- Index for test data filtering (to exclude seed data from production queries)
CREATE INDEX IF NOT EXISTS idx_users_test_data 
ON users(is_test_data)
WHERE is_test_data = true;

-- Partial index for verified users (anti-cheat)
CREATE INDEX IF NOT EXISTS idx_anti_cheat_passed_users
ON anti_cheat_challenges(user_id)
WHERE passed = true;

-- Add statistics for better query planning
ANALYZE test_results;
ANALYZE users;
ANALYZE anti_cheat_challenges;

-- Add comments for documentation
COMMENT ON INDEX idx_test_results_leaderboard_composite IS 'Composite covering index for leaderboard queries (language, wpm, created_at)';
COMMENT ON INDEX idx_test_results_user_language_wpm IS 'Index for finding user best scores per language';
COMMENT ON INDEX idx_test_results_timeframe_leaderboard IS 'Index for timeframe-based leaderboard queries';
COMMENT ON INDEX idx_test_results_user_language_count IS 'Index for counting distinct users per language';

