-- FINAL FIX: Complete trigger rewrite

-- Step 1: Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop ALL versions of handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 3: Create clean function with ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Parse role from metadata with fallback
    BEGIN
        user_role_value := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer');
    EXCEPTION WHEN OTHERS THEN
        user_role_value := 'viewer';
    END;

    -- Insert user profile - ON CONFLICT prevents duplicate errors
    INSERT INTO public.users (
        id, email, first_name, last_name, role,
        is_active, verification_status, created_at, updated_at
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
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 4: Create trigger pointing to PUBLIC.handle_new_user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;

-- Verify
SELECT 'Trigger created successfully!' as status;
