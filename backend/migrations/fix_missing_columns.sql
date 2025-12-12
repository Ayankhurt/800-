-- ============================================
-- BACKEND VERIFICATION FIXES
-- Run this script to fix any missing columns and add performance indexes
-- ============================================

-- Add missing columns to profiles table (if they don't exist)
DO $$ 
BEGIN
    -- Add last_login_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added column: profiles.last_login_at';
    ELSE
        RAISE NOTICE 'Column already exists: profiles.last_login_at';
    END IF;

    -- Add last_login_ip if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_login_ip'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_login_ip INET;
        RAISE NOTICE 'Added column: profiles.last_login_ip';
    ELSE
        RAISE NOTICE 'Column already exists: profiles.last_login_ip';
    END IF;

    -- Add verification_token if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'verification_token'
    ) THEN
        ALTER TABLE profiles ADD COLUMN verification_token VARCHAR(255);
        RAISE NOTICE 'Added column: profiles.verification_token';
    ELSE
        RAISE NOTICE 'Column already exists: profiles.verification_token';
    END IF;

    -- Add verification_expires_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'verification_expires_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN verification_expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added column: profiles.verification_expires_at';
    ELSE
        RAISE NOTICE 'Column already exists: profiles.verification_expires_at';
    END IF;

    -- Add role-specific fields for signup flow
    -- Company name (for GC, Sub, PM)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN company_name TEXT;
        RAISE NOTICE 'Added column: profiles.company_name';
    END IF;

    -- Trade specialization (for GC, Sub, TS)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'trade_specialization'
    ) THEN
        ALTER TABLE profiles ADD COLUMN trade_specialization TEXT;
        RAISE NOTICE 'Added column: profiles.trade_specialization';
    END IF;

    -- Years of experience (for GC, Sub, PM, TS)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'years_experience'
    ) THEN
        ALTER TABLE profiles ADD COLUMN years_experience INTEGER;
        RAISE NOTICE 'Added column: profiles.years_experience';
    END IF;

    -- License number (for GC, Sub)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'license_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN license_number TEXT;
        RAISE NOTICE 'Added column: profiles.license_number';
    END IF;

    -- License type (for GC)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'license_type'
    ) THEN
        ALTER TABLE profiles ADD COLUMN license_type TEXT;
        RAISE NOTICE 'Added column: profiles.license_type';
    END IF;

    -- Insurance details (for GC, PM)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'insurance_details'
    ) THEN
        ALTER TABLE profiles ADD COLUMN insurance_details TEXT;
        RAISE NOTICE 'Added column: profiles.insurance_details';
    END IF;

    -- Location (for all roles)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
        RAISE NOTICE 'Added column: profiles.location';
    END IF;

    -- Portfolio (for GC, Sub, PM, TS)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'portfolio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN portfolio TEXT;
        RAISE NOTICE 'Added column: profiles.portfolio';
    END IF;

    -- Certifications (for Sub, TS)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'certifications'
    ) THEN
        ALTER TABLE profiles ADD COLUMN certifications TEXT;
        RAISE NOTICE 'Added column: profiles.certifications';
    END IF;

    -- Project type (for PM)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'project_type'
    ) THEN
        ALTER TABLE profiles ADD COLUMN project_type TEXT;
        RAISE NOTICE 'Added column: profiles.project_type';
    END IF;
END $$;

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);

-- Create indexes for role-specific fields
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_trade_specialization ON profiles(trade_specialization) WHERE trade_specialization IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location) WHERE location IS NOT NULL;

-- Create indexes for projects table (only if columns exist)
DO $$
BEGIN
    -- Index on created_by if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'created_by'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by) WHERE created_by IS NOT NULL;
        RAISE NOTICE 'Created index: idx_projects_created_by';
    END IF;

    -- Index on status
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    RAISE NOTICE 'Created index: idx_projects_status';

    -- Index on owner_id if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'owner_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
        RAISE NOTICE 'Created index: idx_projects_owner_id';
    END IF;

    -- Index on contractor_id if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'contractor_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON projects(contractor_id) WHERE contractor_id IS NOT NULL;
        RAISE NOTICE 'Created index: idx_projects_contractor_id';
    ELSE
        RAISE NOTICE 'Skipped index: idx_projects_contractor_id (column does not exist)';
    END IF;
END $$;

-- Create indexes for bids table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bids' AND column_name = 'project_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bids_project_id ON bids(project_id);
        RAISE NOTICE 'Created index: idx_bids_project_id';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bids' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
        RAISE NOTICE 'Created index: idx_bids_status';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bids' AND column_name = 'contractor_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bids_contractor_id ON bids(contractor_id);
        RAISE NOTICE 'Created index: idx_bids_contractor_id';
    END IF;
END $$;

-- Create indexes for bid_submissions table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bid_submissions' AND column_name = 'bid_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bid_submissions_bid_id ON bid_submissions(bid_id);
        RAISE NOTICE 'Created index: idx_bid_submissions_bid_id';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bid_submissions' AND column_name = 'contractor_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bid_submissions_contractor_id ON bid_submissions(contractor_id);
        RAISE NOTICE 'Created index: idx_bid_submissions_contractor_id';
    END IF;
END $$;

-- Create indexes for jobs table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'created_by'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
        RAISE NOTICE 'Created index: idx_jobs_created_by';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'project_manager_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_project_manager_id ON jobs(project_manager_id);
        RAISE NOTICE 'Created index: idx_jobs_project_manager_id';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
        RAISE NOTICE 'Created index: idx_jobs_status';
    END IF;
END $$;

-- Create indexes for job_applications table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'job_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
        RAISE NOTICE 'Created index: idx_job_applications_job_id';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'contractor_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_job_applications_contractor_id ON job_applications(contractor_id);
        RAISE NOTICE 'Created index: idx_job_applications_contractor_id';
    END IF;
END $$;

-- Create indexes for sessions table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        RAISE NOTICE 'Created index: idx_sessions_user_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'refresh_token') THEN
        CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
        RAISE NOTICE 'Created index: idx_sessions_refresh_token';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'expires_at') THEN
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
        RAISE NOTICE 'Created index: idx_sessions_expires_at';
    END IF;
END $$;

-- Create indexes for messages table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'conversation_id') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        RAISE NOTICE 'Created index: idx_messages_conversation_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'sender_id') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
        RAISE NOTICE 'Created index: idx_messages_sender_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        RAISE NOTICE 'Created index: idx_messages_created_at';
    END IF;
END $$;

-- Create indexes for notifications table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        RAISE NOTICE 'Created index: idx_notifications_user_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
        RAISE NOTICE 'Created index: idx_notifications_read';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
        RAISE NOTICE 'Created index: idx_notifications_created_at';
    END IF;
END $$;

-- Create indexes for conversations table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'created_by') THEN
        CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
        RAISE NOTICE 'Created index: idx_conversations_created_by';
    END IF;
END $$;

-- Create indexes for conversation_participants table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversation_participants' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
        RAISE NOTICE 'Created index: idx_conversation_participants_user_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversation_participants' AND column_name = 'conversation_id') THEN
        CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
        RAISE NOTICE 'Created index: idx_conversation_participants_conversation_id';
    END IF;
END $$;

-- Create indexes for login_logs table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_logs' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
        RAISE NOTICE 'Created index: idx_login_logs_user_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_logs' AND column_name = 'email_attempted') THEN
        CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email_attempted);
        RAISE NOTICE 'Created index: idx_login_logs_email';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'login_logs' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);
        RAISE NOTICE 'Created index: idx_login_logs_created_at';
    END IF;
END $$;

-- Create indexes for failed_logins table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'failed_logins' AND column_name = 'email') THEN
        CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_logins(email);
        RAISE NOTICE 'Created index: idx_failed_logins_email';
    END IF;
END $$;

-- Create indexes for admin_logs table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_logs' AND column_name = 'admin_id') THEN
        CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
        RAISE NOTICE 'Created index: idx_admin_logs_admin_id';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_logs' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
        RAISE NOTICE 'Created index: idx_admin_logs_created_at';
    END IF;
END $$;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

