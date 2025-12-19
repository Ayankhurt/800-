-- ============================================================================
-- COMPLETE SCHEMA FIX FOR BIDROOM
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- 1. CREATE PUBLIC.USERS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email character varying UNIQUE,
    first_name character varying,
    last_name character varying,
    role character varying DEFAULT 'viewer',
    phone character varying,
    company_name character varying,
    location character varying,
    bio text,
    avatar_url text,
    is_active boolean DEFAULT true,
    verification_status character varying DEFAULT 'unverified',
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    trust_score integer DEFAULT 0,
    average_rating numeric,
    total_reviews integer DEFAULT 0,
    stripe_customer_id character varying,
    stripe_account_id character varying,
    stripe_account_status character varying,
    permissions text[],
    admin_permissions jsonb,
    ban_reason text,
    suspended_until timestamp with time zone,
    suspension_reason text,
    verification_token text,
    ip_whitelist inet[]
);

-- 2. CREATE CONTRACTOR_PROFILES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.contractor_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    trade_specialization character varying,
    license_number character varying,
    license_type character varying,
    insurance_provider character varying,
    years_experience integer DEFAULT 0,
    hourly_rate numeric,
    availability_status character varying DEFAULT 'available',
    service_area text[],
    certifications jsonb,
    portfolio_items jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. CREATE NOTIFICATIONS TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title character varying,
    content text,
    type character varying DEFAULT 'info',
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. DROP EXISTING POLICIES (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.users;

DROP POLICY IF EXISTS "Users can view own contractor profile" ON public.contractor_profiles;
DROP POLICY IF EXISTS "Users can update own contractor profile" ON public.contractor_profiles;
DROP POLICY IF EXISTS "Service role has full access to contractor_profiles" ON public.contractor_profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contractor_profiles;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role has full access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.notifications;

-- 6. CREATE RLS POLICIES
-- Users table policies
CREATE POLICY "Enable all access for authenticated users" 
ON public.users FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Service role has full access to users" 
ON public.users FOR ALL 
USING (true);

-- Contractor profiles policies
CREATE POLICY "Enable all access for authenticated users" 
ON public.contractor_profiles FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Service role has full access to contractor_profiles" 
ON public.contractor_profiles FOR ALL 
USING (true);

-- Notifications policies
CREATE POLICY "Enable all access for authenticated users" 
ON public.notifications FOR ALL 
TO authenticated 
USING (true);

CREATE POLICY "Service role has full access to notifications" 
ON public.notifications FOR ALL 
USING (true);

-- 7. CREATE TRIGGER FUNCTION FOR AUTO-SYNC
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREATE TRIGGER ON AUTH.USERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. CREATE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. ADD UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contractor_profiles_updated_at ON public.contractor_profiles;
CREATE TRIGGER update_contractor_profiles_updated_at
    BEFORE UPDATE ON public.contractor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. ENABLE REALTIME FOR NOTIFICATIONS (skip if already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Table already in publication, ignore
END $$;

-- 12. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_id ON public.contractor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- DONE! Schema is ready.
