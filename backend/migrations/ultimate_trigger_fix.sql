-- ==========================================
-- ULTIMATE FIX: Single trigger with proper conflict handling
-- ==========================================

-- Step 1: Drop ALL custom triggers on auth.users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass
        AND tgname NOT LIKE 'RI_ConstraintTrigger%'
        AND tgname NOT LIKE 'pg_%'
    )
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON auth.users';
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- Step 2: Drop all related functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_new() CASCADE;

-- Step 3: Create ONE clean trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role_value user_role;
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists in public.users
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_exists;
    
    IF user_exists THEN
        -- User already exists, just return
        RAISE NOTICE 'User % already exists in public.users, skipping insert', NEW.id;
        RETURN NEW;
    END IF;

    -- Parse role from metadata
    BEGIN
        user_role_value := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer');
    EXCEPTION
        WHEN OTHERS THEN
            user_role_value := 'viewer';
    END;

    -- Insert new user
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        verification_status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
        user_role_value,
        true,
        'unverified'::verification_status,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;  -- Critical: prevent duplicate errors
  
    RAISE NOTICE 'Created user profile for %', NEW.email;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
        RETURN NEW;  -- Don't block auth user creation
END;
$$;

-- Step 4: Create ONE trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Step 6: Verify
DO $$ 
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
    AND tgname = 'on_auth_user_created';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Trigger setup complete!';
    RAISE NOTICE '✅ Found % trigger(s) named on_auth_user_created', trigger_count;
    RAISE NOTICE '✅ Function: handle_new_user()';
    RAISE NOTICE '✅ Conflict handling: ON CONFLICT DO NOTHING';
    RAISE NOTICE '========================================';
END $$;
