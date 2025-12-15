-- ============================================
-- CREATE FIRST SUPER ADMIN USER
-- ============================================
-- Email: admin@bidroom.com
-- Password: Admin123!@#
-- Role: super_admin
-- ============================================

INSERT INTO admin_users (
  email,
  password_hash,
  role,
  first_name,
  last_name,
  two_factor_enabled,
  is_active
) VALUES (
  'admin@bidroom.com',
  '$2b$10$YvwXqKdXVIaMaS1vRbfXVeSLhWNr8BT3G3u12IbJtPETEMtLckwDe',
  'super_admin',
  'Super',
  'Admin',
  false,
  true
) ON CONFLICT (email) DO NOTHING;

-- Verify the admin was created
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
WHERE email = 'admin@bidroom.com';

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Copy this entire SQL
-- 2. Go to Supabase Dashboard
-- 3. Open SQL Editor
-- 4. Paste and run this SQL
-- 5. Refresh the admin panel
-- 6. Login with:
--    Email: admin@bidroom.com
--    Password: Admin123!@#
-- ============================================
