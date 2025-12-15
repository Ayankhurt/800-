-- ============================================
-- QUICK CHECK: Do admin users exist?
-- ============================================

-- Check 1: Count admin users
SELECT 
  'admin_users' as table_name,
  COUNT(*) as total_users
FROM admin_users;

-- Check 2: List all admin users
SELECT 
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  created_at
FROM admin_users
ORDER BY created_at DESC;

-- Check 3: Check if specific admin exists
SELECT 
  id,
  email,
  role,
  is_active,
  'EXISTS' as status
FROM admin_users
WHERE email = 'admin@bidroom.com';

-- Check 4: Count users with admin roles in users table
SELECT 
  'users (admin roles)' as table_name,
  COUNT(*) as total_users
FROM users
WHERE role IN ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager');

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Run this in Supabase SQL Editor
-- 2. Check if admin_users table has any users
-- 3. If count is 0, you need to run:
--    - INSERT_SUPER_ADMIN.sql (to create first admin)
--    - OR MIGRATE_ADMIN_USERS.sql (to migrate from users table)
-- ============================================
