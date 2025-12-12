-- Clean up test users from public.users table
DELETE FROM public.users 
WHERE email LIKE '%@example.com' OR email LIKE 'test%@%';

-- Show remaining users
SELECT id, email, first_name, last_name, role, created_at 
FROM public.users 
ORDER BY created_at DESC;
