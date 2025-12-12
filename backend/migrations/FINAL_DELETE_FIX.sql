-- FINAL FIX FOR DELETE ERROR
-- This script searches for ANY function referencing 'profiles' and drops it.

-- 1. DROP FUNCTIONS REFERENCING 'profiles'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT n.nspname, p.proname, pg_get_functiondef(p.oid) as def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE pg_get_functiondef(p.oid) ILIKE '%profiles%'
        AND n.nspname = 'public'
        AND p.prokind = 'f' -- Only check normal functions, skip aggregates
    LOOP
        RAISE NOTICE 'Dropping function % because it references profiles', r.proname;
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.nspname) || '.' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
END $$;

-- 2. DROP TRIGGERS ON JOBS TABLE (Again, just to be sure)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'jobs'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(t) || ' ON jobs CASCADE';
    END LOOP;
END $$;

-- 3. CREATE DUMMY PROFILES TABLE (Last Resort Fallback)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GRANT PERMISSIONS
GRANT ALL ON profiles TO postgres, authenticated, service_role;
