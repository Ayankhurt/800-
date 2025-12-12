-- MASTER SCHEMA UPDATE SCRIPT
-- This script ensures all tables and columns from the user's list exist.

-- ==========================================
-- 1. CREATE MISSING TABLES
-- ==========================================

-- AI FEATURES
CREATE TABLE IF NOT EXISTS ai_generated_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    bid_id UUID REFERENCES bids(id),
    owner_notes TEXT,
    generated_contract TEXT,
    california_law_provisions BOOLEAN DEFAULT false,
    generation_time_ms INTEGER,
    ai_model_version VARCHAR(50),
    owner_edits TEXT,
    contractor_edits TEXT,
    final_contract TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_progress_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES milestones(id),
    progress_update_id UUID REFERENCES progress_updates(id),
    analysis_result TEXT,
    work_quality INTEGER, -- 1-100
    completion_percentage INTEGER,
    issues_detected TEXT[],
    recommendations TEXT,
    compliance_check BOOLEAN,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SECURITY & LOGS
CREATE TABLE IF NOT EXISTS blocked_ips (
    ip VARCHAR(45) PRIMARY KEY,
    reason TEXT,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ddos_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip VARCHAR(45),
    endpoint VARCHAR(255),
    count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS failed_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    attempts INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email_attempted VARCHAR(255),
    success BOOLEAN,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MARKETING & REFERRALS
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    target_segment VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    referral_code VARCHAR(50) UNIQUE,
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id),
    referred_user_id UUID REFERENCES users(id),
    referral_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER FEATURES
CREATE TABLE IF NOT EXISTS saved_contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    contractor_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contractor_id)
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    badge_id UUID REFERENCES badges(id),
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT true,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    privacy_profile_visible BOOLEAN DEFAULT true,
    privacy_show_email BOOLEAN DEFAULT false,
    privacy_show_phone BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id),
    contractor_id UUID REFERENCES users(id),
    requested_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 30,
    topic VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id),
    reported_by UUID REFERENCES users(id),
    reason TEXT,
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    moderator_id UUID REFERENCES users(id),
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==========================================

-- JOBS
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS urgency VARCHAR(50) DEFAULT 'normal';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pay_type VARCHAR(50); -- hourly, fixed
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pay_rate DECIMAL(10, 2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS documents TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- JOB APPLICATIONS
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS available_start_date DATE;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id); -- Job owner?

-- PROJECTS
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(12, 2); -- Alias for total_amount if needed

-- BIDS (Bid Requests)
ALTER TABLE bids ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS notes TEXT;

-- BID SUBMISSIONS
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;

-- ==========================================
-- 3. ENABLE RLS FOR NEW TABLES
-- ==========================================

ALTER TABLE ai_generated_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_progress_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddos_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. BASIC POLICIES
-- ==========================================

DO $$ BEGIN
    CREATE POLICY "Admins have full access" ON ai_generated_contracts FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add more policies as needed...
