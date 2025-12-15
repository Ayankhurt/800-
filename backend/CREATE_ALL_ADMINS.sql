-- ============================================
-- CREATE ALL ADMIN USERS (FIXED)
-- Password for all: ayan1212
-- ============================================

-- Step 1: Delete audit logs first (to avoid foreign key constraint)
DELETE FROM audit_logs WHERE admin_id IS NOT NULL;

-- Step 2: Delete all existing admin users
DELETE FROM admin_users;

-- Step 3: Create all admin role users
INSERT INTO admin_users (
  email,
  password_hash,
  role,
  first_name,
  last_name,
  is_active
) VALUES
-- Super Admin
(
  'superadmin@bidroom.com',
  '$2b$10$0cS9omnINtxA7HiA29Xmj.OTRJdMz7CVWBNYknLHztLwQPSiZL0ju',
  'super_admin',
  'Super',
  'Admin',
  true
),
-- Admin
(
  'admin@bidroom.com',
  '$2b$10$0cS9omnINtxA7HiA29Xmj.OTRJdMz7CVWBNYknLHztLwQPSiZL0ju',
  'admin',
  'Admin',
  'User',
  true
),
-- Moderator
(
  'moderator@bidroom.com',
  '$2b$10$0cS9omnINtxA7HiA29Xmj.OTRJdMz7CVWBNYknLHztLwQPSiZL0ju',
  'moderator',
  'Moderator',
  'User',
  true
),
-- Support Agent
(
  'support@bidroom.com',
  '$2b$10$0cS9omnINtxA7HiA29Xmj.OTRJdMz7CVWBNYknLHztLwQPSiZL0ju',
  'support_agent',
  'Support',
  'Agent',
  true
),
-- Finance Manager
(
  'finance@bidroom.com',
  '$2b$10$0cS9omnINtxA7HiA29Xmj.OTRJdMz7CVWBNYknLHztLwQPSiZL0ju',
  'finance_manager',
  'Finance',
  'Manager',
  true
);

-- Step 4: Verify all users created
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
  END;

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================
-- All users have the same password: ayan1212
--
-- 1. Super Admin:
--    Email: superadmin@bidroom.com
--    Password: ayan1212
--
-- 2. Admin:
--    Email: admin@bidroom.com
--    Password: ayan1212
--
-- 3. Moderator:
--    Email: moderator@bidroom.com
--    Password: ayan1212
--
-- 4. Support Agent:
--    Email: support@bidroom.com
--    Password: ayan1212
--
-- 5. Finance Manager:
--    Email: finance@bidroom.com
--    Password: ayan1212
-- ============================================
