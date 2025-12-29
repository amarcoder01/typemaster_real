-- Add performance indexes for feedback system
-- This migration adds composite indexes and improves query performance

-- Composite index for common admin dashboard queries (status + priority + created_at)
CREATE INDEX IF NOT EXISTS idx_feedback_status_priority_created 
ON feedback(status, priority, created_at DESC) 
WHERE is_spam = false AND is_archived = false;

-- Composite index for category filtering with status
CREATE INDEX IF NOT EXISTS idx_feedback_category_status_created 
ON feedback(category_id, status, created_at DESC) 
WHERE is_spam = false AND is_archived = false;

-- Full-text search index for subject and message
CREATE INDEX IF NOT EXISTS idx_feedback_search_subject 
ON feedback USING gin(to_tsvector('english', subject));

CREATE INDEX IF NOT EXISTS idx_feedback_search_message 
ON feedback USING gin(to_tsvector('english', message));

-- Index for AI sentiment filtering
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment_created 
ON feedback(sentiment_label, created_at DESC) 
WHERE is_spam = false AND sentiment_label IS NOT NULL;

-- Index for resolved feedback queries
CREATE INDEX IF NOT EXISTS idx_feedback_resolved_at 
ON feedback(resolved_at DESC) 
WHERE resolved_at IS NOT NULL;

-- Index for admin user feedback queries
CREATE INDEX IF NOT EXISTS idx_feedback_resolved_by 
ON feedback(resolved_by_user_id, resolved_at DESC) 
WHERE resolved_by_user_id IS NOT NULL;

-- Composite index for feedback responses by feedback_id and created_at
CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback_created 
ON feedback_responses(feedback_id, created_at DESC);

-- Index for admin responses (for admin activity tracking)
CREATE INDEX IF NOT EXISTS idx_feedback_responses_admin 
ON feedback_responses(admin_user_id, created_at DESC);

-- Composite index for status history queries
CREATE INDEX IF NOT EXISTS idx_feedback_status_history_feedback_created 
ON feedback_status_history(feedback_id, created_at DESC);

-- Index for tracking admin activity in status changes
CREATE INDEX IF NOT EXISTS idx_feedback_status_history_admin 
ON feedback_status_history(changed_by_user_id, created_at DESC) 
WHERE changed_by_user_id IS NOT NULL;

-- Index for upvote queries
CREATE INDEX IF NOT EXISTS idx_feedback_upvotes_user 
ON feedback_upvotes(user_id, created_at DESC);

-- Partial index for high-priority unresolved feedback
CREATE INDEX IF NOT EXISTS idx_feedback_high_priority_unresolved 
ON feedback(priority, created_at DESC) 
WHERE status IN ('new', 'under_review', 'in_progress') 
AND priority IN ('high', 'critical') 
AND is_spam = false;

-- Index for rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_feedback_rate_limits_identifier_type 
ON feedback_rate_limits(identifier, identifier_type, window_start DESC);

-- Partial index for blocked submitters
CREATE INDEX IF NOT EXISTS idx_feedback_rate_limits_blocked 
ON feedback_rate_limits(identifier, identifier_type, blocked_until) 
WHERE is_blocked = true AND blocked_until > NOW();

-- Add comment explaining the indexes
COMMENT ON INDEX idx_feedback_status_priority_created IS 'Optimizes admin dashboard list queries with status and priority filters';
COMMENT ON INDEX idx_feedback_search_subject IS 'Enables full-text search on feedback subject';
COMMENT ON INDEX idx_feedback_search_message IS 'Enables full-text search on feedback message';
COMMENT ON INDEX idx_feedback_high_priority_unresolved IS 'Quickly finds urgent unresolved feedback';

