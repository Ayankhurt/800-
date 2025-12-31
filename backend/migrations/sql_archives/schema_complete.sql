-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. CLEANUP (Remove Redundant Tables)
-- ==========================================
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS payments CASCADE; -- We use transactions table instead

-- ==========================================
-- 1. ENUMS & TYPES
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager', 'general_contractor', 'project_manager', 'subcontractor', 'trade_specialist', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled', 'on_hold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bid_status AS ENUM ('draft', 'submitted', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('setup', 'active', 'completed', 'disputed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_status AS ENUM ('not_started', 'in_progress', 'submitted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'held');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. USER MANAGEMENT
-- ==========================================

-- Public Profiles / Users Table (Syncs with Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Links to auth.users if using Supabase Auth
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
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

-- Contractor Specific Details (Extension of users)
CREATE TABLE IF NOT EXISTS contractor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    trade_specialization VARCHAR(100),
    license_number VARCHAR(100),
    license_type VARCHAR(100),
    license_expiry DATE,
    insurance_provider VARCHAR(100),
    insurance_policy_no VARCHAR(100),
    insurance_expiry DATE,
    years_experience INTEGER,
    hourly_rate_min DECIMAL(10, 2),
    hourly_rate_max DECIMAL(10, 2),
    service_area_radius_km INTEGER,
    availability_status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users (For Admin Console)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL, -- super_admin, admin, etc.
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    two_factor_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. JOBS & BIDS
-- ==========================================

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_manager_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    trade_type VARCHAR(100) NOT NULL,
    status job_status DEFAULT 'open',
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    start_date DATE,
    end_date DATE,
    requirements JSONB DEFAULT '{}', -- Flexible requirements
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, accepted, rejected
    cover_letter TEXT,
    proposed_rate DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, contractor_id)
);

CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id), -- Optional, can be direct bid
    project_manager_id UUID NOT NULL REFERENCES users(id), -- Who requested the bid
    contractor_id UUID REFERENCES users(id), -- Specific contractor invited (optional)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status bid_status DEFAULT 'draft',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bid_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(12, 2) NOT NULL,
    timeline_days INTEGER,
    proposal_text TEXT,
    attachments TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. PROJECT MANAGEMENT
-- ==========================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id),
    bid_id UUID REFERENCES bids(id),
    owner_id UUID NOT NULL REFERENCES users(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'setup',
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    escrow_balance DECIMAL(12, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    contract_signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE,
    status milestone_status DEFAULT 'not_started',
    order_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id),
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_to UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cost_impact DECIMAL(12, 2) DEFAULT 0,
    timeline_impact_days INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    rejected_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_generated_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content JSONB NOT NULL, -- Stores the full contract structure
    california_provisions JSONB, -- Specific legal requirements
    owner_notes TEXT,
    is_signed_owner BOOLEAN DEFAULT false,
    is_signed_contractor BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    work_completed TEXT,
    photos TEXT[] DEFAULT '{}',
    gps_location JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. FINANCIALS
-- ==========================================

CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    balance DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, frozen, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id), -- Can be null for platform fees
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- deposit, milestone_release, refund, fee
    status payment_status DEFAULT 'pending',
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. COMMUNICATION & SOCIAL
-- ==========================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id), -- Optional, link to project
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. ADMIN & MODERATION
-- ==========================================

CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    raised_by UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    description TEXT,
    status dispute_status DEFAULT 'open',
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL, -- job, review, user
    content_id UUID NOT NULL,
    reported_by UUID REFERENCES users(id),
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, resolved, dismissed
    assigned_to UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- identity, license, insurance
    documents TEXT[] NOT NULL,
    status verification_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES admin_users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    target_resource VARCHAR(100),
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. INDEXES & TRIGGERS
-- ==========================================

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_contractor ON projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON messages(sender_id); -- Placeholder for notifications table if needed

-- Trigger Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_modtime') THEN
        CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_jobs_modtime') THEN
        CREATE TRIGGER update_jobs_modtime BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_modtime') THEN
        CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bids_modtime') THEN
        CREATE TRIGGER update_bids_modtime BEFORE UPDATE ON bids FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on key tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true); -- Adjust based on privacy needs

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Jobs Policies
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON jobs;
CREATE POLICY "Jobs are viewable by everyone" ON jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Project Managers can create jobs" ON jobs;
CREATE POLICY "Project Managers can create jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = project_manager_id);

DROP POLICY IF EXISTS "Project Managers can update own jobs" ON jobs;
CREATE POLICY "Project Managers can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = project_manager_id);

-- Projects Policies
DROP POLICY IF EXISTS "Users can view projects they are involved in" ON projects;
CREATE POLICY "Users can view projects they are involved in" ON projects 
    FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = contractor_id);

-- Messages Policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = messages.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );
