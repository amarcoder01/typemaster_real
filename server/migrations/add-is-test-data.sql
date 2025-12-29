-- Add is_test_data column to users table
-- This column marks test/seed data for easy cleanup

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on test data
CREATE INDEX IF NOT EXISTS users_is_test_data_idx ON users(is_test_data) WHERE is_test_data = true;

-- Add comment for documentation
COMMENT ON COLUMN users.is_test_data IS 'Marks users created by seed scripts for testing purposes';

