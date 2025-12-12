-- ==========================================
-- SAFE CLEANUP: Remove only custom triggers
-- ==========================================

-- Step 1: Drop only custom triggers (not system constraint triggers)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass
        AND tgname NOT LIKE 'RI_ConstraintTrigger%'  -- Skip system triggers
        AND tgname NOT LIKE 'pg_%'                    -- Skip postgres triggers
    )
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON auth.users';
        RAISE NOTICE 'Dropped custom trigger: %', r.tgname;
    END LOOP;
END $$;

-- Step 2: Drop custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 3: Drop profiles table if exists
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 4: Ensure users table exists
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    phone VARCHAR(20),
    company_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    location VARCHAR(255),
    verification_status verification_status DEFAULT 'unverified',
    verification_token TEXT,
    trust_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Get role from metadata, default to 'viewer'
    BEGIN
        user_role_value := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer');
    EXCEPTION
        WHEN OTHERS THEN
            user_role_value := 'viewer';
    END;

    -- Insert into public.users
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        verification_status
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
        user_role_value,
        true,
        'unverified'::verification_status
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
  
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't block auth user creation
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 6: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Step 8: RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
    ON public.users FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full access" ON public.users;
CREATE POLICY "Service role full access" 
    ON public.users 
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Setup complete!';
    RAISE NOTICE '✅ Trigger: on_auth_user_created';
    RAISE NOTICE '✅ Function: handle_new_user()';
    RAISE NOTICE '✅ Table: public.users';
    RAISE NOTICE '========================================';
END $$;
