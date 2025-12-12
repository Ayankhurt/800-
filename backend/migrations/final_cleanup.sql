-- Step 1: Clean up orphaned auth users (users in auth.users but not in public.users)
-- This will be done manually from Supabase Dashboard

-- Step 2: Clean up all test/example users from public.users
DELETE FROM public.users 
WHERE email LIKE '%example.com' 
   OR email LIKE 'test%@%'
   OR email LIKE '%@test.%';

-- Step 3: Verify cleanup
SELECT COUNT(*) as total_users FROM public.users;

-- Step 4: Show remaining users
SELECT id, email, first_name, last_name, role, created_at 
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;
