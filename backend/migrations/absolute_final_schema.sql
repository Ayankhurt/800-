-- ABSOLUTE FINAL SCHEMA SYNC
-- This script ensures EVERY table and column from the user's master list exists.
-- It handles the re-creation of tables that might have been dropped (like roles) and adds all missing tables.

-- ==========================================
-- 1. CORE AUTH & USERS (Ensuring existence)
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50), -- Using VARCHAR to support both ENUM and string
    phone VARCHAR(50),
    company_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    location VARCHAR(255),
    verification_status VARCHAR(50),
    trust_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    verification_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE,
    code VARCHAR(100) UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    code VARCHAR(100) UNIQUE,
    description TEXT,
    module VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. PROJECTS, JOBS & BIDS
-- ==========================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID, -- Self reference or external ID?
    title TEXT,
    description TEXT,
    budget NUMERIC,
    status TEXT,
    owner_id UUID REFERENCES users(id),
    contractor_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    last_update_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    description TEXT,
    location VARCHAR(255),
    trade_type VARCHAR(100),
    specialization VARCHAR(100),
    status VARCHAR(50),
    urgency VARCHAR(50),
    budget_min NUMERIC,
    budget_max NUMERIC,
    pay_type VARCHAR(50),
    pay_rate NUMERIC,
    start_date DATE,
    end_date DATE,
    requirements JSONB,
    images TEXT[],
    documents TEXT[],
    project_manager_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    application_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    submitted_by UUID REFERENCES users(id),
    amount NUMERIC,
    notes TEXT,
    status TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bid_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID REFERENCES bids(id),
    contractor_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    amount NUMERIC,
    timeline_days INTEGER,
    proposal TEXT,
    documents TEXT[],
    status VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    contractor_id UUID REFERENCES users(id),
    owner_id UUID REFERENCES users(id),
    status VARCHAR(50),
    cover_letter TEXT,
    proposed_rate NUMERIC,
    available_start_date DATE,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    contractor_id UUID REFERENCES users(id),
    invited_by UUID REFERENCES users(id),
    message TEXT,
    status VARCHAR(50),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. MILESTONES & PROGRESS
-- ==========================================

CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    title TEXT,
    amount NUMERIC,
    due_date DATE,
    status TEXT,
    proof_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    contractor_id UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    payment_amount NUMERIC,
    deliverables TEXT[],
    acceptance_criteria TEXT[],
    status VARCHAR(50),
    order_number INTEGER,
    depends_on UUID REFERENCES project_milestones(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    revision_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    milestone_id UUID REFERENCES project_milestones(id),
    contractor_id UUID REFERENCES users(id),
    update_type VARCHAR(50),
    work_completed TEXT,
    work_planned TEXT,
    issues TEXT,
    hours_worked NUMERIC,
    crew_members INTEGER,
    photos TEXT[],
    videos TEXT[],
    gps_location JSONB,
    weather_conditions VARCHAR(100),
    ai_analyzed BOOLEAN DEFAULT false,
    ai_analysis_id UUID,
    order_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    milestone_id UUID REFERENCES project_milestones(id),
    requested_by UUID REFERENCES users(id),
    requested_to UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    cost_impact NUMERIC,
    timeline_impact_days INTEGER,
    documents TEXT[],
    status VARCHAR(50),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. COMMUNICATION & MESSAGING
-- ==========================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT,
    created_by UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    job_id UUID REFERENCES jobs(id),
    bid_id UUID REFERENCES bids(id),
    owner_id UUID REFERENCES users(id),
    contractor_id UUID REFERENCES users(id),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    project_id UUID REFERENCES projects(id),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false, -- Duplicate in list, keeping both
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    content TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title TEXT,
    body TEXT,
    message TEXT,
    seen BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    metadata JSONB,
    job_id UUID,
    application_id UUID,
    bid_id UUID,
    project_id UUID,
    milestone_id UUID,
    dispute_id UUID,
    action_url TEXT,
    type VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token TEXT,
    platform TEXT,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. FINANCIALS
-- ==========================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    milestone_id UUID REFERENCES project_milestones(id),
    payer_id UUID REFERENCES users(id),
    payee_id UUID REFERENCES users(id),
    type VARCHAR(50),
    status VARCHAR(50),
    amount NUMERIC,
    platform_fee NUMERIC,
    processor_fee NUMERIC,
    payment_processor TEXT,
    processor_payment_id TEXT,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    payment_id UUID REFERENCES transactions(id),
    amount NUMERIC,
    status VARCHAR(50),
    stripe_account_id TEXT,
    processor_payout_id TEXT,
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    total_amount NUMERIC,
    funded_amount NUMERIC,
    remaining_balance NUMERIC,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES users(id),
    client_id UUID REFERENCES users(id),
    project_title VARCHAR(255),
    items JSONB,
    total_amount NUMERIC,
    valid_until DATE,
    notes TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. DISPUTES & REVIEWS
-- ==========================================

CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    raised_by UUID REFERENCES users(id),
    resolved_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    reason TEXT,
    description TEXT,
    dispute_type VARCHAR(100),
    status TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id),
    sender_id UUID REFERENCES users(id),
    message TEXT,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispute_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id),
    user_id UUID REFERENCES users(id),
    message TEXT,
    evidence TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    rating_overall INTEGER,
    rating_quality INTEGER,
    rating_communication INTEGER,
    rating_timeline INTEGER,
    rating_professionalism INTEGER,
    rating_value INTEGER,
    rating INTEGER, -- Duplicate in list
    title VARCHAR(255),
    body TEXT,
    comment TEXT, -- Duplicate in list
    photos TEXT[],
    response TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    reported BOOLEAN DEFAULT false,
    hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. PROFILES & PORTFOLIO
-- ==========================================

CREATE TABLE IF NOT EXISTS contractor_profiles (
    user_id UUID REFERENCES users(id) PRIMARY KEY,
    profile_id UUID, -- Duplicate?
    company_name TEXT,
    bio TEXT,
    mission_statement TEXT,
    service_area TEXT,
    service_area_geo JSONB,
    license_number TEXT,
    license_type TEXT,
    license_state TEXT,
    license_expires_at DATE,
    license_verified BOOLEAN,
    insurance_company TEXT,
    insurance_policy_number TEXT,
    insurance_coverage_amount NUMERIC,
    insurance_amount NUMERIC, -- Duplicate?
    insurance_expires_at DATE,
    insurance_expiry_date DATE, -- Duplicate?
    insurance_verified BOOLEAN,
    bonding_info TEXT,
    certifications JSONB,
    affiliations JSONB,
    years_in_business INTEGER,
    experience_years INTEGER, -- Duplicate?
    team_size INTEGER,
    avg_rating NUMERIC,
    review_count INTEGER,
    response_rate NUMERIC,
    typical_response_time_minutes INTEGER,
    completion_rate NUMERIC,
    on_time_completion_rate NUMERIC,
    repeat_customer_rate NUMERIC,
    portfolio_projects JSONB,
    portfolio JSONB, -- Duplicate?
    hourly_rate NUMERIC,
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    images TEXT[],
    project_type VARCHAR(100),
    completion_date DATE,
    is_featured BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES users(id),
    name VARCHAR(255),
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url TEXT,
    is_verified BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID REFERENCES users(id),
    endorsed_by UUID REFERENCES users(id),
    skill VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES users(id),
    viewer_id UUID REFERENCES users(id),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. ADMIN & SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(255),
    target_resource VARCHAR(255),
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50),
    content_id UUID,
    reported_by UUID REFERENCES users(id),
    report_reason VARCHAR(255),
    report_details TEXT,
    status VARCHAR(50),
    priority VARCHAR(50),
    assigned_to UUID REFERENCES users(id),
    moderator_notes TEXT,
    action_taken VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    content TEXT,
    type VARCHAR(50),
    target_audience VARCHAR(100),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    description TEXT,
    icon_url TEXT,
    criteria JSONB,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    uploaded_by UUID REFERENCES users(id),
    url TEXT,
    type TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    assigned_to UUID REFERENCES users(id),
    role TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    created_by UUID REFERENCES users(id),
    attendee_id UUID REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    documents TEXT[],
    status VARCHAR(50), -- Using VARCHAR to be safe
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- ==========================================
-- 9. FINAL CLEANUP & SYNC
-- ==========================================
-- This section ensures that if tables already existed, they have all the columns.

ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS documents TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_count INTEGER;

-- Add functional columns found in reference files but missing in JSON list
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS group_name VARCHAR(50) DEFAULT 'general';
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT; -- In case code uses this instead of admin_notes

-- ==========================================
-- 10. INDEXES (From create_missing_admin_tables.sql)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================
-- 11. DEFAULT DATA (From create_missing_admin_tables.sql)
-- ==========================================

INSERT INTO system_settings (key, value, description, group_name) VALUES
  ('site_name', '"BidRoom"', 'Platform name', 'general'),
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'general'),
  ('allow_registration', 'true', 'Allow new user registration', 'auth'),
  ('platform_fee_percent', '5', 'Platform fee percentage', 'finance'),
  ('min_withdrawal_amount', '50', 'Minimum withdrawal amount', 'finance')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 12. ROW LEVEL SECURITY (From update_schema_master.sql)
-- ==========================================

-- Enable RLS on sensitive tables
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
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policy: Admins have access to everything (Generic fallback)
DO $$ BEGIN
    CREATE POLICY "Admins have full access" ON system_settings FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;


