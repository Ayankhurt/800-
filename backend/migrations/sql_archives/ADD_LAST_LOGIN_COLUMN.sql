-- ============================================
-- ADD LAST_LOGIN_AT COLUMN TO ADMIN_USERS
-- ============================================

-- Add last_login_at column
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE NULL;

-- Add comment
COMMENT ON COLUMN admin_users.last_login_at IS 'Timestamp of the last successful login';

-- Verify column added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- ============================================
-- EXPECTED RESULT:
-- Should show last_login_at column with:
-- - data_type: timestamp with time zone
-- - is_nullable: YES
-- - column_default: NULL
-- ============================================
