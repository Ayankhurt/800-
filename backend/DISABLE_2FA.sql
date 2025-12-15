-- ============================================
-- DISABLE 2FA FOR ALL ADMIN USERS
-- ============================================

-- Update all admin users to disable two-factor authentication
UPDATE admin_users
SET two_factor_enabled = false
WHERE two_factor_enabled = true;

-- Verify all users have 2FA disabled
SELECT 
  email,
  role,
  two_factor_enabled,
  is_active
FROM admin_users
ORDER BY role;

-- ============================================
-- EXPECTED RESULT:
-- All users should have two_factor_enabled = false
-- ============================================
