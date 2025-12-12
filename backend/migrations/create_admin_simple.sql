-- Simple Admin User Creation (Alternative Method)
-- Execute this in Supabase SQL Editor

-- Method 1: Direct Insert (Simpler, Recommended)
-- This creates user directly in users table
-- You'll need to set password through Supabase Auth UI or use Method 2

INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  verification_status,
  trust_score
) VALUES (
  gen_random_uuid(),
  'admin@bidroom.com',
  'Admin',
  'User',
  'admin'::user_role,
  true,
  'verified'::verification_status,
  100
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin'::user_role,
  is_active = true,
  verification_status = 'verified'::verification_status;

-- Verify user was created
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  verification_status
FROM users 
WHERE email = 'admin@bidroom.com';

-- IMPORTANT: After running this, you need to:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Find the user with email 'admin@bidroom.com'
-- 3. If user doesn't exist in auth.users, create it:
--    - Click "Add User"
--    - Email: admin@bidroom.com
--    - Password: Admin@123
--    - Auto Confirm: Yes
-- 4. Copy the auth user ID
-- 5. Update the users table to link them:

-- UPDATE users 
-- SET id = '<AUTH_USER_ID_FROM_STEP_4>'
-- WHERE email = 'admin@bidroom.com';
