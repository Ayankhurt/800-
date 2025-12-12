-- Helper Functions for Roles & Permissions
-- Execute this AFTER roles_and_permissions.sql

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_code VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  -- Check if user has permission through their role
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON u.role::text = r.code
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id
      AND p.code = p_permission_code
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has any of the specified permissions
CREATE OR REPLACE FUNCTION user_has_any_permission(
  p_user_id UUID,
  p_permission_codes VARCHAR[]
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM users u
    JOIN roles r ON u.role::text = r.code
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id
      AND p.code = ANY(p_permission_codes)
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has all specified permissions
CREATE OR REPLACE FUNCTION user_has_all_permissions(
  p_user_id UUID,
  p_permission_codes VARCHAR[]
)
RETURNS BOOLEAN AS $$
DECLARE
  has_all BOOLEAN;
  required_count INTEGER;
  actual_count INTEGER;
BEGIN
  required_count := array_length(p_permission_codes, 1);
  
  SELECT COUNT(DISTINCT p.code) INTO actual_count
  FROM users u
  JOIN roles r ON u.role::text = r.code
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = p_user_id
    AND p.code = ANY(p_permission_codes);
  
  has_all := (actual_count = required_count);
  
  RETURN has_all;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_code VARCHAR,
  permission_name VARCHAR,
  module VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.code,
    p.name,
    p.module
  FROM users u
  JOIN roles r ON u.role::text = r.code
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = p_user_id
  ORDER BY p.module, p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role details
CREATE OR REPLACE FUNCTION get_user_role_details(p_user_id UUID)
RETURNS TABLE (
  role_code VARCHAR,
  role_name VARCHAR,
  role_description TEXT,
  permission_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.code,
    r.name,
    r.description,
    COUNT(rp.permission_id) as permission_count
  FROM users u
  JOIN roles r ON u.role::text = r.code
  LEFT JOIN role_permissions rp ON r.id = rp.role_id
  WHERE u.id = p_user_id
  GROUP BY r.id, r.code, r.name, r.description;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- EXAMPLE USAGE
-- ==========================================

-- Check if user has permission
-- SELECT user_has_permission('user-uuid-here', 'admin.users.view');

-- Check if user has any permission
-- SELECT user_has_any_permission('user-uuid-here', ARRAY['admin.users.view', 'admin.users.edit']);

-- Check if user has all permissions
-- SELECT user_has_all_permissions('user-uuid-here', ARRAY['admin.users.view', 'admin.users.edit']);

-- Get all user permissions
-- SELECT * FROM get_user_permissions('user-uuid-here');

-- Get user role details
-- SELECT * FROM get_user_role_details('user-uuid-here');
