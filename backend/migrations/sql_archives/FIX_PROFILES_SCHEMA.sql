-- ============================================
-- Fix Profiles Table Schema Issues
-- ============================================
-- This script fixes the profiles table to ensure
-- profiles.id matches auth.users.id correctly

-- Step 1: Check current state
-- Run this first to see which column matches auth.users.id
SELECT 
  'profiles.id matches auth.users.id' as check_type,
  COUNT(*) as matching_count
FROM public.profiles p
INNER JOIN auth.users au ON p.id = au.id

UNION ALL

SELECT 
  'profiles.user_id matches auth.users.id' as check_type,
  COUNT(*) as matching_count
FROM public.profiles p
INNER JOIN auth.users au ON p.user_id = au.id;

-- Step 2: If profiles.id matches auth.users.id (recommended)
-- Add foreign key constraint
ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: If user_id is redundant and id matches auth.users.id
-- Option A: Remove user_id column (if not used elsewhere)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_id;
-- DROP INDEX IF EXISTS idx_profiles_user_id;
-- DROP INDEX IF EXISTS profiles_user_id_idx;

-- Option B: Keep user_id but ensure it matches id
-- UPDATE public.profiles SET user_id = id WHERE user_id IS NULL OR user_id != id;

-- Step 4: If profiles.user_id matches auth.users.id instead
-- Migrate data: Copy user_id to id
-- UPDATE public.profiles SET id = user_id WHERE id != user_id;

-- Step 5: Add trigger to ensure id matches auth.users.id on insert
CREATE OR REPLACE FUNCTION sync_profile_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If id is null, use user_id (if exists)
  IF NEW.id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.id := NEW.user_id;
  END IF;
  -- If user_id is null, use id
  IF NEW.user_id IS NULL AND NEW.id IS NOT NULL THEN
    NEW.user_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_id_trigger ON public.profiles;
CREATE TRIGGER sync_profile_id_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_id();

-- Step 6: Verify the fix
SELECT 
  p.id as profile_id,
  p.user_id,
  au.id as auth_user_id,
  CASE 
    WHEN p.id = au.id THEN '✅ id matches'
    WHEN p.user_id = au.id THEN '⚠️ user_id matches (id mismatch)'
    ELSE '❌ No match'
  END as status
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id OR p.user_id = au.id
LIMIT 10;

