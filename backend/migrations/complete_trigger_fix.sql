-- ==========================================
-- STEP 1: Remove old Supabase default triggers
-- ==========================================

-- Drop any existing triggers that reference profiles table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Check and drop any default Supabase profile triggers
DO $$ 
BEGIN
    -- Drop trigger if exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Drop old handle_new_user functions
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    
    RAISE NOTICE 'Old triggers removed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error removing old triggers: %', SQLERRM;
END $$;

-- ==========================================
-- STEP 2: Create new trigger for users table
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users table (NOT profiles)
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
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer'),
    true,
    'unverified'::verification_status,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block auth user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- STEP 3: Grant permissions
-- ==========================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ==========================================
-- STEP 4: Verify setup
-- ==========================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Trigger setup complete!';
    RAISE NOTICE 'Trigger will now create entries in public.users (not profiles)';
END $$;
