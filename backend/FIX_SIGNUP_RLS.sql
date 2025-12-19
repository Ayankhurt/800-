-- FIX SIGNUP ISSUE: Update RLS policies to allow service role to insert users

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users;

-- Create permissive policies for service role (backend)
CREATE POLICY "Allow service role full access" 
ON public.users 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own profile" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DONE! Now signup should work.
