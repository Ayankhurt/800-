-- Create Default Super Admin User
-- Password: Admin123!@# (hashed with bcrypt)

-- Note: This is a sample admin user for testing
-- In production, change the password immediately after first login

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
  '$2a$10$rZ5K3YxH8qGvF7P9mN2L4.eJ6wX5tQ8vR2nM1kL3pY4sT6uV7wX8y', -- Password: Admin123!@#
  'super_admin',
  'Super',
  'Admin',
  false,
  true
) ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT 
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  created_at
FROM admin_users
WHERE email = 'admin@bidroom.com';
