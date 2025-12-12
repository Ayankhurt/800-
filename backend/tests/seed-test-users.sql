-- Seed Test Users for API Testing
-- Run this script to create test users for E2E testing

-- Test User 1: Regular APP_USER
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testuser@example.com',
  crypt('Test123!@#', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, first_name, last_name, role_code, user_type, account_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testuser@example.com',
  'Test',
  'User',
  'CONTRACTOR',
  'APP_USER',
  'APP_USER',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role_code = EXCLUDED.role_code,
  user_type = EXCLUDED.user_type,
  account_type = EXCLUDED.account_type,
  status = EXCLUDED.status;

-- Test User 2: ADMIN_USER
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'testadmin@example.com',
  crypt('Admin123!@#', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, first_name, last_name, role_code, user_type, account_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'testadmin@example.com',
  'Test',
  'Admin',
  'ADMIN',
  'ADMIN_USER',
  'ADMIN_USER',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role_code = EXCLUDED.role_code,
  user_type = EXCLUDED.user_type,
  account_type = EXCLUDED.account_type,
  status = EXCLUDED.status;

-- Test User 3: ADMIN_APP (Mobile Admin)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'testadminapp@example.com',
  crypt('AdminApp123!@#', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, first_name, last_name, role_code, user_type, account_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'testadminapp@example.com',
  'Test',
  'AdminApp',
  'ADMIN_APP',
  'APP_USER', -- ADMIN_APP can have APP_USER account_type
  'APP_USER',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role_code = EXCLUDED.role_code,
  user_type = EXCLUDED.user_type,
  account_type = EXCLUDED.account_type,
  status = EXCLUDED.status;

-- Test User 4: SUPER Admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'testsuper@example.com',
  crypt('Super123!@#', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, first_name, last_name, role_code, user_type, account_type, status)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'testsuper@example.com',
  'Test',
  'Super',
  'SUPER',
  'ADMIN_USER',
  'ADMIN_USER',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role_code = EXCLUDED.role_code,
  user_type = EXCLUDED.user_type,
  account_type = EXCLUDED.account_type,
  status = EXCLUDED.status;

-- Verify users created
SELECT 
  id,
  email,
  role_code,
  user_type,
  account_type,
  status
FROM public.profiles
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'
);




