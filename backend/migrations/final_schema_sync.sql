-- FINAL SCHEMA SYNC SCRIPT
-- This script adds any potential missing columns based on the comprehensive JSON list provided.
-- It uses IF NOT EXISTS to be safe to run multiple times.

-- 1. USERS & PROFILES
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE contractor_profiles
ADD COLUMN IF NOT EXISTS service_area_geo jsonb,
ADD COLUMN IF NOT EXISTS insurance_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS license_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS portfolio_projects jsonb,
ADD COLUMN IF NOT EXISTS affiliations jsonb,
ADD COLUMN IF NOT EXISTS certifications jsonb,
ADD COLUMN IF NOT EXISTS team_size integer,
ADD COLUMN IF NOT EXISTS years_in_business integer;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS privacy_profile_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_show_email boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_show_phone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications boolean DEFAULT true;

-- 2. PROJECTS & JOBS
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS project_id uuid, -- Self reference?
ADD COLUMN IF NOT EXISTS budget numeric,
ADD COLUMN IF NOT EXISTS last_update_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS urgency text,
ADD COLUMN IF NOT EXISTS pay_type text,
ADD COLUMN IF NOT EXISTS pay_rate numeric,
ADD COLUMN IF NOT EXISTS documents text[],
ADD COLUMN IF NOT EXISTS application_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

ALTER TABLE project_milestones
ADD COLUMN IF NOT EXISTS depends_on uuid REFERENCES project_milestones(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS revision_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS deliverables text[],
ADD COLUMN IF NOT EXISTS acceptance_criteria text[];

ALTER TABLE progress_updates
ADD COLUMN IF NOT EXISTS ai_analyzed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_analysis_id uuid,
ADD COLUMN IF NOT EXISTS weather_conditions text,
ADD COLUMN IF NOT EXISTS gps_location jsonb,
ADD COLUMN IF NOT EXISTS photos text[],
ADD COLUMN IF NOT EXISTS videos text[];

ALTER TABLE change_orders
ADD COLUMN IF NOT EXISTS timeline_impact_days integer,
ADD COLUMN IF NOT EXISTS cost_impact numeric,
ADD COLUMN IF NOT EXISTS documents text[];

-- 3. BIDS & APPLICATIONS
ALTER TABLE bids
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS amount numeric,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE bid_submissions
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS timeline_days integer,
ADD COLUMN IF NOT EXISTS documents text[];

ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS available_start_date date,
ADD COLUMN IF NOT EXISTS attachments text[],
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS proposed_rate numeric;

-- 4. DISPUTES & SUPPORT
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS dispute_type text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id);

ALTER TABLE support_tickets
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS priority text,
ADD COLUMN IF NOT EXISTS resolution text;

-- 5. LOGS & NOTIFICATIONS
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS metadata jsonb,
ADD COLUMN IF NOT EXISTS action_url text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS job_id uuid,
ADD COLUMN IF NOT EXISTS application_id uuid,
ADD COLUMN IF NOT EXISTS bid_id uuid,
ADD COLUMN IF NOT EXISTS project_id uuid;

ALTER TABLE admin_activity_logs
ADD COLUMN IF NOT EXISTS changes jsonb,
ADD COLUMN IF NOT EXISTS resource_type text,
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text;

-- 6. MISC
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS photos text[],
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reported boolean DEFAULT false;

ALTER TABLE payouts
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS processor_payout_id text,
ADD COLUMN IF NOT EXISTS failure_reason text;

-- Ensure ENUM types exist (if not already)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'contractor', 'client', 'super_admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'unverified');
    END IF;
END$$;

-- Apply ENUMs to users table if they are currently text (safe cast)
-- Note: This might fail if data is incompatible, so we wrap in a block or user should check.
-- ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
-- ALTER TABLE users ALTER COLUMN verification_status TYPE verification_status USING verification_status::verification_status;
