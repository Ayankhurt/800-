-- ==============================================
-- FIX FOR "relation profiles does not exist" ERROR
-- ==============================================

-- 1. Create a dummy 'profiles' table to satisfy the old reference
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Grant permissions so the trigger can access it
GRANT ALL ON public.profiles TO postgres, authenticated, service_role;

-- 3. Insert a dummy profile for the test user (admin) if needed
-- This ensures that if the trigger tries to UPDATE a row, it exists.
INSERT INTO public.profiles (id, username, full_name)
SELECT id, 'admin', 'Admin User'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (id) DO NOTHING;

-- 4. Clean up any other known bad triggers
DROP TRIGGER IF EXISTS on_job_deleted ON jobs;
DROP TRIGGER IF EXISTS on_job_application_created ON job_applications;
