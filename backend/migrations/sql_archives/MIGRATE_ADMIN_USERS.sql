-- ============================================
-- MIGRATE ADMIN USERS: users → admin_users
-- ============================================
-- Default Password for all migrated users: TempPass123!@#
-- Users MUST change this on first login!
-- ============================================

-- STEP 1: View current admin users in 'users' table
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at
FROM users
WHERE role IN ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager')
ORDER BY role;

-- STEP 2: Copy admin users to admin_users table
INSERT INTO admin_users (
  email,
  password_hash,
  role,
  first_name,
  last_name,
  two_factor_enabled,
  is_active,
  created_at
)
SELECT 
  email,
  '$2b$10$Ewz5hEQMg5b0PJpz0LXLy.Q1zyyyoJwaiX/JNqx5jMzAIPv7kddUO', -- TempPass123!@#
  role,
  first_name,
  last_name,
  false,
  is_active,
  created_at
FROM users
WHERE role IN ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = EXCLUDED.is_active;

-- STEP 3: Verify migration (CHECK THIS BEFORE DELETING!)
SELECT 
  'ADMIN_USERS TABLE' as location,
  COUNT(*) as total_count,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators,
  COUNT(CASE WHEN role = 'support_agent' THEN 1 END) as support_agents,
  COUNT(CASE WHEN role = 'finance_manager' THEN 1 END) as finance_managers
FROM admin_users

UNION ALL

SELECT 
  'USERS TABLE (ADMIN ROLES)' as location,
  COUNT(*) as total_count,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators,
  COUNT(CASE WHEN role = 'support_agent' THEN 1 END) as support_agents,
  COUNT(CASE WHEN role = 'finance_manager' THEN 1 END) as finance_managers
FROM users
WHERE role IN ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager');

-- STEP 4: Delete admin users from users table
-- ⚠️ ONLY RUN THIS AFTER VERIFYING STEP 3! ⚠️
DELETE FROM users 
WHERE role IN ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager');

-- STEP 5: Final verification
SELECT 
  'admin_users' as table_name,
  COUNT(*) as count,
  string_agg(DISTINCT role::text, ', ') as roles
FROM admin_users
GROUP BY table_name

UNION ALL

SELECT 
  'users (admin roles - should be 0)' as table_name,
  COUNT(*) as count,
  string_agg(DISTINCT role::text, ', ') as roles
FROM users
WHERE role IN ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager')
GROUP BY table_name;

-- STEP 6: List all migrated admin users
SELECT 
  email,
  role,
  first_name,
  last_name,
  is_active,
  created_at
FROM admin_users
ORDER BY 
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'moderator' THEN 3
    WHEN 'support_agent' THEN 4
    WHEN 'finance_manager' THEN 5
  END,
  email;

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- All admin users have been moved to admin_users table
-- Default password: TempPass123!@#
-- 
-- Next steps:
-- 1. Refresh admin panel
-- 2. Login with each admin user
-- 3. Change password immediately
-- ============================================
