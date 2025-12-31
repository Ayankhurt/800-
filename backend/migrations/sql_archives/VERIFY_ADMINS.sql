-- ============================================
-- VERIFY ADMIN USERS EXIST
-- ============================================

-- Check 1: Count total admin users
SELECT 
  COUNT(*) as total_admin_users
FROM admin_users;

-- Check 2: List all admin users with details
SELECT 
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  two_factor_enabled,
  created_at
FROM admin_users
ORDER BY 
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    WHEN 'support_agent' THEN 4
    WHEN 'finance_manager' THEN 5
  END;

-- Check 3: Verify specific admin exists
SELECT 
  'EXISTS' as status,
  email,
  role,
  is_active
FROM admin_users
WHERE email = 'superadmin@bidroom.com';

-- Check 4: Test if password hash is correct
-- (This just shows the hash, you can't reverse it)
SELECT 
  email,
  role,
  LEFT(password_hash, 20) || '...' as password_hash_preview
FROM admin_users;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- Total users: 5
-- Emails:
--   - superadmin@bidroom.com (super_admin)
--   - admin@bidroom.com (admin)
--   - moderator@bidroom.com (moderator)
--   - support@bidroom.com (support_agent)
--   - finance@bidroom.com (finance_manager)
--
-- All should have:
--   - is_active: true
--   - password: ayan1212
-- ============================================
