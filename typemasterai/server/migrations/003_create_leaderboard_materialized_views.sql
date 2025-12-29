-- Leaderboard Performance Optimization: Materialized Views
-- This migration creates pre-computed materialized views for fast leaderboard queries

-- Drop existing views if they exist (for re-running migration)
DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard_monthly CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard_weekly CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard_daily CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_leaderboard_global CASCADE;

-- Global leaderboard (all-time) materialized view
-- Pre-computes best scores per user per language with rankings
CREATE MATERIALIZED VIEW mv_leaderboard_global AS
WITH ranked_users AS (
  SELECT 
    tr.user_id,
    tr.wpm,
    tr.accuracy,
    tr.mode,
    tr.created_at,
    tr.language,
    ROW_NUMBER() OVER (
      PARTITION BY tr.user_id, tr.language 
      ORDER BY tr.wpm DESC, tr.created_at DESC
    ) as rn
  FROM test_results tr
  WHERE (tr.freestyle = false OR tr.freestyle IS NULL)
),
best_scores AS (
  SELECT 
    user_id,
    wpm,
    accuracy,
    mode,
    created_at,
    language
  FROM ranked_users 
  WHERE rn = 1
),
test_counts AS (
  SELECT 
    user_id,
    language,
    COUNT(*)::int as total_tests
  FROM test_results
  WHERE (freestyle = false OR freestyle IS NULL)
  GROUP BY user_id, language
)
SELECT 
  bs.user_id,
  u.username,
  bs.wpm,
  bs.accuracy,
  bs.mode,
  bs.created_at,
  bs.language,
  u.avatar_color,
  COALESCE(tc.total_tests, 1) as total_tests,
  DENSE_RANK() OVER (
    PARTITION BY bs.language 
    ORDER BY bs.wpm DESC, bs.created_at ASC
  ) as rank,
  COALESCE(acc.certified_wpm IS NOT NULL, false) as is_verified
FROM best_scores bs
INNER JOIN users u ON bs.user_id = u.id
LEFT JOIN test_counts tc ON bs.user_id = tc.user_id AND bs.language = tc.language
LEFT JOIN anti_cheat_challenges acc ON bs.user_id = acc.user_id AND acc.passed = true
WHERE u.is_test_data = false OR u.is_test_data IS NULL;

-- Create indexes on materialized view for fast lookups
CREATE INDEX idx_mv_leaderboard_language_rank ON mv_leaderboard_global(language, rank);
CREATE INDEX idx_mv_leaderboard_user ON mv_leaderboard_global(user_id, language);
CREATE INDEX idx_mv_leaderboard_wpm ON mv_leaderboard_global(language, wpm DESC);
CREATE UNIQUE INDEX idx_mv_leaderboard_unique ON mv_leaderboard_global(user_id, language);

-- Daily leaderboard (last 24 hours)
CREATE MATERIALIZED VIEW mv_leaderboard_daily AS
WITH ranked_users AS (
  SELECT 
    tr.user_id,
    tr.wpm,
    tr.accuracy,
    tr.mode,
    tr.created_at,
    tr.language,
    ROW_NUMBER() OVER (
      PARTITION BY tr.user_id, tr.language 
      ORDER BY tr.wpm DESC, tr.created_at DESC
    ) as rn
  FROM test_results tr
  WHERE (tr.freestyle = false OR tr.freestyle IS NULL)
    AND tr.created_at >= CURRENT_DATE
),
best_scores AS (
  SELECT * FROM ranked_users WHERE rn = 1
),
test_counts AS (
  SELECT 
    user_id,
    language,
    COUNT(*)::int as total_tests
  FROM test_results
  WHERE (freestyle = false OR freestyle IS NULL)
    AND created_at >= CURRENT_DATE
  GROUP BY user_id, language
)
SELECT 
  bs.user_id,
  u.username,
  bs.wpm,
  bs.accuracy,
  bs.mode,
  bs.created_at,
  bs.language,
  u.avatar_color,
  COALESCE(tc.total_tests, 1) as total_tests,
  DENSE_RANK() OVER (
    PARTITION BY bs.language 
    ORDER BY bs.wpm DESC, bs.created_at ASC
  ) as rank,
  COALESCE(acc.certified_wpm IS NOT NULL, false) as is_verified
FROM best_scores bs
INNER JOIN users u ON bs.user_id = u.id
LEFT JOIN test_counts tc ON bs.user_id = tc.user_id AND bs.language = tc.language
LEFT JOIN anti_cheat_challenges acc ON bs.user_id = acc.user_id AND acc.passed = true
WHERE u.is_test_data = false OR u.is_test_data IS NULL;

CREATE INDEX idx_mv_leaderboard_daily_language_rank ON mv_leaderboard_daily(language, rank);
CREATE INDEX idx_mv_leaderboard_daily_user ON mv_leaderboard_daily(user_id, language);
CREATE UNIQUE INDEX idx_mv_leaderboard_daily_unique ON mv_leaderboard_daily(user_id, language);

-- Weekly leaderboard (last 7 days)
CREATE MATERIALIZED VIEW mv_leaderboard_weekly AS
WITH ranked_users AS (
  SELECT 
    tr.user_id,
    tr.wpm,
    tr.accuracy,
    tr.mode,
    tr.created_at,
    tr.language,
    ROW_NUMBER() OVER (
      PARTITION BY tr.user_id, tr.language 
      ORDER BY tr.wpm DESC, tr.created_at DESC
    ) as rn
  FROM test_results tr
  WHERE (tr.freestyle = false OR tr.freestyle IS NULL)
    AND tr.created_at >= CURRENT_DATE - INTERVAL '7 days'
),
best_scores AS (
  SELECT * FROM ranked_users WHERE rn = 1
),
test_counts AS (
  SELECT 
    user_id,
    language,
    COUNT(*)::int as total_tests
  FROM test_results
  WHERE (freestyle = false OR freestyle IS NULL)
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY user_id, language
)
SELECT 
  bs.user_id,
  u.username,
  bs.wpm,
  bs.accuracy,
  bs.mode,
  bs.created_at,
  bs.language,
  u.avatar_color,
  COALESCE(tc.total_tests, 1) as total_tests,
  DENSE_RANK() OVER (
    PARTITION BY bs.language 
    ORDER BY bs.wpm DESC, bs.created_at ASC
  ) as rank,
  COALESCE(acc.certified_wpm IS NOT NULL, false) as is_verified
FROM best_scores bs
INNER JOIN users u ON bs.user_id = u.id
LEFT JOIN test_counts tc ON bs.user_id = tc.user_id AND bs.language = tc.language
LEFT JOIN anti_cheat_challenges acc ON bs.user_id = acc.user_id AND acc.passed = true
WHERE u.is_test_data = false OR u.is_test_data IS NULL;

CREATE INDEX idx_mv_leaderboard_weekly_language_rank ON mv_leaderboard_weekly(language, rank);
CREATE INDEX idx_mv_leaderboard_weekly_user ON mv_leaderboard_weekly(user_id, language);
CREATE UNIQUE INDEX idx_mv_leaderboard_weekly_unique ON mv_leaderboard_weekly(user_id, language);

-- Monthly leaderboard (last 30 days)
CREATE MATERIALIZED VIEW mv_leaderboard_monthly AS
WITH ranked_users AS (
  SELECT 
    tr.user_id,
    tr.wpm,
    tr.accuracy,
    tr.mode,
    tr.created_at,
    tr.language,
    ROW_NUMBER() OVER (
      PARTITION BY tr.user_id, tr.language 
      ORDER BY tr.wpm DESC, tr.created_at DESC
    ) as rn
  FROM test_results tr
  WHERE (tr.freestyle = false OR tr.freestyle IS NULL)
    AND tr.created_at >= CURRENT_DATE - INTERVAL '30 days'
),
best_scores AS (
  SELECT * FROM ranked_users WHERE rn = 1
),
test_counts AS (
  SELECT 
    user_id,
    language,
    COUNT(*)::int as total_tests
  FROM test_results
  WHERE (freestyle = false OR freestyle IS NULL)
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id, language
)
SELECT 
  bs.user_id,
  u.username,
  bs.wpm,
  bs.accuracy,
  bs.mode,
  bs.created_at,
  bs.language,
  u.avatar_color,
  COALESCE(tc.total_tests, 1) as total_tests,
  DENSE_RANK() OVER (
    PARTITION BY bs.language 
    ORDER BY bs.wpm DESC, bs.created_at ASC
  ) as rank,
  COALESCE(acc.certified_wpm IS NOT NULL, false) as is_verified
FROM best_scores bs
INNER JOIN users u ON bs.user_id = u.id
LEFT JOIN test_counts tc ON bs.user_id = tc.user_id AND bs.language = tc.language
LEFT JOIN anti_cheat_challenges acc ON bs.user_id = acc.user_id AND acc.passed = true
WHERE u.is_test_data = false OR u.is_test_data IS NULL;

CREATE INDEX idx_mv_leaderboard_monthly_language_rank ON mv_leaderboard_monthly(language, rank);
CREATE INDEX idx_mv_leaderboard_monthly_user ON mv_leaderboard_monthly(user_id, language);
CREATE UNIQUE INDEX idx_mv_leaderboard_monthly_unique ON mv_leaderboard_monthly(user_id, language);

-- Grant permissions
GRANT SELECT ON mv_leaderboard_global TO PUBLIC;
GRANT SELECT ON mv_leaderboard_daily TO PUBLIC;
GRANT SELECT ON mv_leaderboard_weekly TO PUBLIC;
GRANT SELECT ON mv_leaderboard_monthly TO PUBLIC;

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW mv_leaderboard_global IS 'Pre-computed all-time leaderboard rankings for fast queries';
COMMENT ON MATERIALIZED VIEW mv_leaderboard_daily IS 'Pre-computed daily leaderboard rankings (last 24 hours)';
COMMENT ON MATERIALIZED VIEW mv_leaderboard_weekly IS 'Pre-computed weekly leaderboard rankings (last 7 days)';
COMMENT ON MATERIALIZED VIEW mv_leaderboard_monthly IS 'Pre-computed monthly leaderboard rankings (last 30 days)';

