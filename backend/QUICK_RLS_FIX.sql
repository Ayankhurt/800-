-- QUICK RLS FIX - Run this NOW in Supabase SQL Editor
-- This allows users to signup

-- 1. Temporarily disable RLS (fastest way)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Then re-enable with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Add all required policies
DROP POLICY IF EXISTS "Public profiles viewable" ON public.users;
CREATE POLICY "Public profiles viewable" ON public.users 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert profile" ON public.users;
CREATE POLICY "Users can insert profile" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);
