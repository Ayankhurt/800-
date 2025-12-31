-- Update all test users' passwords to 'ayan1212'
-- Run this in Supabase SQL Editor

-- First, let's see what the password column is actually called
-- Check one user to see the structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE '%pass%';

-- Now update all test users with bcrypt hash of 'ayan1212'
-- Bcrypt hash for 'ayan1212' with salt rounds 10:
-- $2b$10$YourActualHashHere

-- Update admin users
UPDATE auth.users 
SET encrypted_password = crypt('ayan1212', gen_salt('bf'))
WHERE email IN (
  'admin@bidroom.com',
  'super@bidroom.com',
  'mod@bidroom.com',
  'support@bidroom.com',
  'finance@bidroom.com'
);

-- Update regular users
UPDATE auth.users 
SET encrypted_password = crypt('ayan1212', gen_salt('bf'))
WHERE email IN (
  'pm@test.com',
  'cont@bidroom.com',
  'sub@bidroom.com',
  'ts@test.com'
);

-- Verify the update
SELECT email, role, created_at 
FROM public.users 
WHERE email IN (
  'admin@bidroom.com',
  'super@bidroom.com',
  'mod@bidroom.com',
  'support@bidroom.com',
  'finance@bidroom.com',
  'pm@test.com',
  'cont@bidroom.com',
  'sub@bidroom.com',
  'ts@test.com'
)
ORDER BY email;
