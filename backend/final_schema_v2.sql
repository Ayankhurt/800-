-- ==============================================================================
-- COMPREHENSIVE DATABASE SCHEMA
-- Generated from full_and_final.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TYPES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager', 'general_contractor', 'project_manager', 'subcontractor', 'trade_specialist', 'viewer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
    END IF;
END $$;

-- 2. COMMON FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_ticket_number() RETURNS TRIGGER AS $$
BEGIN IF NEW.ticket_number IS NULL THEN NEW.ticket_number = 'TICK-' || upper(substring(gen_random_uuid()::text from 1 for 8)); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;

-- 3. TABLES
-- Table: admin_activity_logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    resource_id uuid,
    admin_id uuid,
    resource_type character varying,
    action character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    user_agent text,
    ip_address inet,
    changes jsonb
);

-- Table: admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    two_factor_secret character varying,
    email character varying,
    password_hash character varying,
    role character varying,
    two_factor_enabled boolean,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name character varying,
    is_active boolean,
    last_login_at timestamp with time zone,
    last_name character varying,
    avatar_url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: ai_generated_contracts
CREATE TABLE IF NOT EXISTS public.ai_generated_contracts (
    owner_edits jsonb,
    created_at timestamp with time zone DEFAULT now(),
    final_contract jsonb,
    contractor_edits jsonb,
    ai_model_version text,
    owner_notes text,
    generation_time_ms integer,
    california_law_provisions jsonb,
    generated_contract jsonb,
    bid_id uuid,
    project_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: ai_progress_analysis
CREATE TABLE IF NOT EXISTS public.ai_progress_analysis (
    compliance_check jsonb,
    issues_detected jsonb,
    completion_percentage integer,
    analyzed_at timestamp with time zone,
    work_quality character varying,
    recommendations ARRAY,
    analysis_result jsonb,
    progress_update_id uuid,
    milestone_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: ai_timelines
CREATE TABLE IF NOT EXISTS public.ai_timelines (
    generated_timeline jsonb,
    milestones jsonb,
    ai_model_version character varying,
    dependencies jsonb,
    created_at timestamp with time zone DEFAULT now(),
    critical_path jsonb,
    generation_time_ms integer,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid
);

-- Table: announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    created_at timestamp with time zone DEFAULT now(),
    content text,
    created_by uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    title character varying,
    target_audience character varying,
    type character varying,
    is_active boolean
);

-- Table: appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    attendee_id uuid,
    created_by uuid,
    project_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status character varying,
    description text,
    title character varying,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    start_time timestamp with time zone
);

-- Table: assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    created_at timestamp without time zone DEFAULT now(),
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    role text,
    assigned_to uuid
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    ip_address inet,
    details jsonb,
    target_id uuid,
    admin_id uuid,
    target_resource character varying,
    action character varying
);

-- Table: badges
CREATE TABLE IF NOT EXISTS public.badges (
    is_active boolean,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    name character varying,
    criteria jsonb,
    description text,
    icon_url text
);

-- Table: bid_submissions
CREATE TABLE IF NOT EXISTS public.bid_submissions (
    updated_at timestamp with time zone DEFAULT now(),
    amount numeric,
    contractor_id uuid,
    bid_id uuid,
    proposal text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    created_by uuid,
    timeline_days integer,
    documents ARRAY,
    status character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    submitted_at timestamp with time zone
);

-- Table: bids
CREATE TABLE IF NOT EXISTS public.bids (
    notes text,
    status text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    amount numeric,
    submitted_by uuid,
    project_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: blocked_ips
CREATE TABLE IF NOT EXISTS public.blocked_ips (
    created_at timestamp with time zone DEFAULT now(),
    blocked_until timestamp with time zone,
    reason text,
    ip text
);

-- Table: certifications
CREATE TABLE IF NOT EXISTS public.certifications (
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    name character varying,
    issuing_organization character varying,
    contractor_id uuid,
    credential_url text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id character varying,
    issue_date date,
    expiry_date date,
    is_verified boolean
);

-- Table: change_orders
CREATE TABLE IF NOT EXISTS public.change_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    description text,
    rejected_reason text,
    status character varying,
    documents ARRAY,
    title character varying,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    approved_at timestamp with time zone,
    approved_by uuid,
    timeline_impact_days integer,
    cost_impact numeric,
    requested_to uuid,
    requested_by uuid,
    milestone_id uuid,
    project_id uuid
);

-- Table: content_reports
CREATE TABLE IF NOT EXISTS public.content_reports (
    resolution_notes text,
    admin_notes text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid,
    reported_by uuid,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    content_type character varying,
    action_taken character varying,
    status character varying,
    description text,
    reason character varying,
    reviewed_at timestamp with time zone
);

-- Table: contractor_profiles
CREATE TABLE IF NOT EXISTS public.contractor_profiles (
    repeat_customer_rate numeric,
    bonding_info text,
    insurance_policy_number text,
    insurance_company text,
    license_state text,
    license_type text,
    license_number text,
    service_area text,
    mission_statement text,
    bio text,
    specialties ARRAY,
    company_name text,
    profile_id uuid,
    hourly_rate numeric,
    experience_years integer,
    insurance_expiry_date date,
    insurance_amount numeric,
    portfolio jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    service_area_geo jsonb,
    license_expires_at date,
    license_verified boolean,
    insurance_coverage_amount numeric,
    insurance_expires_at date,
    insurance_verified boolean,
    certifications jsonb,
    affiliations jsonb,
    years_in_business integer,
    team_size integer,
    avg_rating numeric,
    review_count integer,
    response_rate numeric,
    typical_response_time_minutes integer,
    completion_rate numeric,
    on_time_completion_rate numeric,
    portfolio_projects jsonb
);

-- Table: contractor_verifications
CREATE TABLE IF NOT EXISTS public.contractor_verifications (
    rejection_reason text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id uuid,
    verified_by uuid,
    verified_at timestamp with time zone,
    expiry_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    verification_type character varying,
    document_url text,
    verification_status character varying,
    admin_notes text
);

-- Table: conversation_participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    last_read_at timestamp with time zone,
    user_id uuid,
    conversation_id uuid
);

-- Table: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    project_id uuid,
    created_by uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid,
    contractor_id uuid,
    last_message_at timestamp with time zone,
    bid_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    subject text,
    created_at timestamp with time zone DEFAULT now(),
    job_id uuid
);

-- Table: ddos_logs
CREATE TABLE IF NOT EXISTS public.ddos_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    count integer,
    created_at timestamp with time zone DEFAULT now(),
    ip text,
    endpoint text
);

-- Table: device_tokens
CREATE TABLE IF NOT EXISTS public.device_tokens (
    token text,
    last_used_at timestamp with time zone,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    platform text
);

-- Table: dispute_messages
CREATE TABLE IF NOT EXISTS public.dispute_messages (
    created_at timestamp with time zone DEFAULT now(),
    sender_id uuid,
    dispute_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text,
    attachments ARRAY
);

-- Table: dispute_responses
CREATE TABLE IF NOT EXISTS public.dispute_responses (
    user_id uuid,
    dispute_id uuid,
    evidence ARRAY,
    message text,
    created_at timestamp with time zone DEFAULT now(),
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: disputes
CREATE TABLE IF NOT EXISTS public.disputes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid,
    description text,
    dispute_type character varying,
    status text,
    reason text,
    created_at timestamp without time zone DEFAULT now(),
    resolved_by uuid,
    raised_by uuid,
    project_id uuid
);

-- Table: documents
CREATE TABLE IF NOT EXISTS public.documents (
    project_id uuid,
    uploaded_by uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text,
    url text,
    created_at timestamp without time zone DEFAULT now()
);

-- Table: email_campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    subject character varying,
    recipients_count integer,
    opened_count integer,
    clicked_count integer,
    content text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    name character varying,
    status character varying,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    target_segment jsonb,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: email_verification_tokens
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
    created_at timestamp with time zone DEFAULT now(),
    token text,
    expires_at timestamp with time zone,
    used_at timestamp with time zone,
    user_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: endorsements
CREATE TABLE IF NOT EXISTS public.endorsements (
    message text,
    endorsed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    contractor_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    skill character varying
);

-- Table: escrow_accounts
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
    updated_at timestamp with time zone DEFAULT now(),
    status character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    total_amount numeric,
    funded_amount numeric,
    remaining_balance numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: escrow_transactions
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
    deposited_by uuid,
    deposited_at timestamp with time zone,
    released_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status character varying,
    stripe_transfer_id character varying,
    stripe_payment_intent_id character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    milestone_id uuid,
    amount numeric
);

-- Table: failed_logins
CREATE TABLE IF NOT EXISTS public.failed_logins (
    created_at timestamp with time zone DEFAULT now(),
    locked_until timestamp with time zone,
    email text,
    last_attempt_at timestamp with time zone,
    attempts integer,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: job_applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    proposed_rate numeric,
    job_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status character varying,
    cover_letter text,
    attachments ARRAY,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    owner_id uuid,
    available_start_date date,
    contractor_id uuid
);

-- Table: job_invites
CREATE TABLE IF NOT EXISTS public.job_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status character varying,
    message text,
    created_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone,
    invited_by uuid,
    contractor_id uuid,
    job_id uuid
);

-- Table: jobs
CREATE TABLE IF NOT EXISTS public.jobs (
    pay_rate numeric,
    budget_max numeric,
    budget_min numeric,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pay_type character varying,
    images ARRAY,
    documents ARRAY,
    status character varying,
    specialization character varying,
    description text,
    title character varying,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    application_count integer,
    created_by uuid,
    trade_type character varying,
    location character varying,
    urgency character varying,
    project_manager_id uuid,
    requirements jsonb,
    end_date date,
    start_date date
);

-- Table: login_logs
CREATE TABLE IF NOT EXISTS public.login_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    success boolean,
    created_at timestamp with time zone DEFAULT now(),
    device text,
    user_agent text,
    ip_address text,
    reason text,
    email_attempted text
);

-- Table: message_templates
CREATE TABLE IF NOT EXISTS public.message_templates (
    content text,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title character varying,
    category character varying
);

-- Table: messages
CREATE TABLE IF NOT EXISTS public.messages (
    conversation_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    sender_id uuid,
    project_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message text,
    read boolean,
    receiver_id uuid,
    is_read boolean
);

-- Table: milestones
CREATE TABLE IF NOT EXISTS public.milestones (
    amount numeric,
    due_date date,
    proof_url text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    title text,
    status text
);

-- Table: moderation_queue
CREATE TABLE IF NOT EXISTS public.moderation_queue (
    resolved_at timestamp with time zone,
    content_id uuid,
    reported_by uuid,
    status character varying,
    moderator_notes text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type character varying,
    action_taken character varying,
    report_details text,
    created_at timestamp with time zone DEFAULT now(),
    assigned_to uuid,
    report_reason character varying,
    priority character varying
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    is_read boolean,
    content text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    title character varying,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    type character varying
);

-- Table: password_reset_logs
CREATE TABLE IF NOT EXISTS public.password_reset_logs (
    user_agent text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reason text,
    ip_address text,
    email text,
    success boolean,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: password_reset_tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    created_at timestamp with time zone DEFAULT now(),
    used_at timestamp with time zone,
    expires_at timestamp with time zone,
    user_id uuid,
    token text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: payouts
CREATE TABLE IF NOT EXISTS public.payouts (
    updated_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    payment_id uuid,
    stripe_account_id text,
    status character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    failure_reason text,
    processor_payout_id text,
    contractor_id uuid,
    project_id uuid,
    amount numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    module character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    description text,
    name character varying,
    code character varying
);

-- Table: portfolio_items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
    is_featured boolean,
    completion_date date,
    contractor_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_type character varying,
    title character varying,
    images ARRAY,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    description text
);

-- Table: profile_views
CREATE TABLE IF NOT EXISTS public.profile_views (
    viewed_at timestamp with time zone,
    viewer_id uuid,
    profile_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: progress_updates
CREATE TABLE IF NOT EXISTS public.progress_updates (
    update_type character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    milestone_id uuid,
    contractor_id uuid,
    hours_worked numeric,
    crew_members integer,
    gps_location jsonb,
    ai_analyzed boolean,
    ai_analysis_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    order_number integer,
    work_completed text,
    work_planned text,
    issues text,
    photos ARRAY,
    videos ARRAY,
    weather_conditions character varying
);

-- Table: project_milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
    contractor_id uuid,
    status character varying,
    acceptance_criteria ARRAY,
    deliverables ARRAY,
    description text,
    title character varying,
    rejection_reason text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    due_date date,
    payment_amount numeric,
    order_number integer,
    depends_on uuid,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    approved_by uuid,
    revision_count integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: projects
CREATE TABLE IF NOT EXISTS public.projects (
    description text,
    title text,
    end_date date,
    start_date date,
    last_update_at timestamp with time zone,
    project_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    contractor_id uuid,
    owner_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    status text,
    location character varying,
    category character varying,
    budget numeric,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: quotes
CREATE TABLE IF NOT EXISTS public.quotes (
    project_title character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id uuid,
    client_id uuid,
    items jsonb,
    total_amount numeric,
    valid_until date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status character varying,
    notes text
);

-- Table: referral_uses
CREATE TABLE IF NOT EXISTS public.referral_uses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id uuid,
    referred_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    status character varying,
    referral_code character varying
);

-- Table: referrals
CREATE TABLE IF NOT EXISTS public.referrals (
    total_earnings numeric,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    total_referrals integer,
    user_id uuid,
    referral_code character varying,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: reports
CREATE TABLE IF NOT EXISTS public.reports (
    reported_user_id uuid,
    report_type character varying,
    reason character varying,
    description text,
    status character varying,
    moderator_action character varying,
    moderator_notes text,
    reporter_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    moderator_id uuid,
    related_id uuid
);

-- Table: review_reports
CREATE TABLE IF NOT EXISTS public.review_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    review_id uuid,
    reason text,
    moderator_id uuid,
    details text,
    status character varying,
    moderator_notes text
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    rating_timeline integer,
    rating_professionalism integer,
    comment text,
    response text,
    photo_urls ARRAY,
    contractor_response text,
    rating_overall integer,
    is_hidden boolean,
    rating_value integer,
    reviewee_id uuid,
    reviewer_id uuid,
    project_id uuid,
    title character varying,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    body text,
    photos ARRAY,
    rating_quality integer,
    rating_communication integer,
    category_ratings jsonb,
    response_date timestamp with time zone,
    rating integer,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    hidden boolean,
    reported boolean,
    is_verified boolean
);

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    created_at timestamp with time zone DEFAULT now(),
    role_id uuid,
    permission_id uuid
);

-- Table: roles
CREATE TABLE IF NOT EXISTS public.roles (
    is_system_role boolean,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    description text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    name character varying,
    code character varying
);

-- Table: saved_contractors
CREATE TABLE IF NOT EXISTS public.saved_contractors (
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    contractor_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Table: sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    created_at timestamp without time zone DEFAULT now(),
    ip_address text,
    refresh_token text,
    user_agent text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    expires_at timestamp without time zone
);

-- Table: support_ticket_messages
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    ticket_id uuid,
    message text,
    sender_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_only boolean,
    created_at timestamp with time zone DEFAULT now(),
    attachments ARRAY
);

-- Table: support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    created_at timestamp with time zone DEFAULT now(),
    description text,
    resolved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    category character varying,
    assigned_to uuid,
    user_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resolution text,
    priority character varying,
    ticket_number character varying,
    status character varying,
    subject character varying
);

-- Table: system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    updated_by uuid,
    description text,
    group_name character varying,
    key character varying,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    amount numeric,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status character varying,
    payment_processor text,
    processor_fee numeric,
    meta jsonb,
    platform_fee numeric,
    payer_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    type character varying,
    processor_payment_id text,
    payee_id uuid,
    milestone_id uuid,
    project_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: typing_indicators
CREATE TABLE IF NOT EXISTS public.typing_indicators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid,
    user_id uuid,
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: uploads
CREATE TABLE IF NOT EXISTS public.uploads (
    public_url text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    related_id uuid,
    upload_type character varying,
    thumbnail_url text,
    file_name character varying,
    file_type character varying,
    storage_path text,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    file_size integer
);

-- Table: user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    assigned_by uuid,
    badge_id uuid,
    assigned_at timestamp with time zone,
    expiry_date timestamp with time zone
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid,
    assigned_at timestamp with time zone,
    assigned_by uuid,
    role_id uuid
);

-- Table: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    sms_notifications boolean,
    push_notifications boolean,
    email_notifications boolean,
    user_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    privacy_profile_visible boolean,
    privacy_show_email boolean,
    privacy_show_phone boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    timezone character varying,
    language character varying,
    marketing_emails boolean
);

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
    ban_reason text,
    permissions ARRAY,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role user_role,
    stripe_account_status character varying,
    stripe_customer_id character varying,
    verification_status verification_status,
    account_status character varying,
    trust_score integer,
    is_active boolean,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    company_name character varying,
    bio text,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now(),
    location character varying,
    suspended_until timestamp with time zone,
    average_rating numeric,
    total_reviews integer,
    verification_token text,
    suspension_reason text,
    email character varying,
    first_name character varying,
    last_name character varying,
    two_factor_enabled boolean,
    admin_permissions jsonb,
    stripe_account_id character varying,
    phone character varying,
    ip_whitelist ARRAY
);

-- Table: verification_requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
    rejection_reason text,
    updated_at timestamp with time zone DEFAULT now(),
    documents ARRAY,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_by uuid,
    status verification_status,
    user_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type character varying
);

-- Table: video_consultations
CREATE TABLE IF NOT EXISTS public.video_consultations (
    requested_date timestamp with time zone,
    requester_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    duration_minutes integer,
    meeting_link text,
    contractor_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    status character varying,
    description text,
    topic character varying
);

-- 4. FOREIGN KEYS
DO $$ BEGIN
    ALTER TABLE public.bid_submissions ADD CONSTRAINT fk_bid_submissions_bid_id_bids FOREIGN KEY (bid_id) REFERENCES public.bids(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.disputes ADD CONSTRAINT fk_disputes_raised_by_users FOREIGN KEY (raised_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.progress_updates ADD CONSTRAINT fk_progress_updates_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.progress_updates ADD CONSTRAINT fk_progress_updates_milestone_id_project_milestones FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.disputes ADD CONSTRAINT fk_disputes_resolved_by_users FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.escrow_accounts ADD CONSTRAINT fk_escrow_accounts_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.dispute_messages ADD CONSTRAINT fk_dispute_messages_dispute_id_disputes FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.disputes ADD CONSTRAINT fk_disputes_created_by_users FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.reviews ADD CONSTRAINT fk_reviews_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.reports ADD CONSTRAINT fk_reports_reporter_id_users FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.reports ADD CONSTRAINT fk_reports_reported_user_id_users FOREIGN KEY (reported_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.reports ADD CONSTRAINT fk_reports_moderator_id_users FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.contractor_verifications ADD CONSTRAINT fk_contractor_verifications_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.contractor_verifications ADD CONSTRAINT fk_contractor_verifications_verified_by_users FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.typing_indicators ADD CONSTRAINT fk_typing_indicators_conversation_id_conversations FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.typing_indicators ADD CONSTRAINT fk_typing_indicators_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.ai_generated_contracts ADD CONSTRAINT fk_ai_generated_contracts_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.ai_generated_contracts ADD CONSTRAINT fk_ai_generated_contracts_bid_id_bids FOREIGN KEY (bid_id) REFERENCES public.bids(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.ai_progress_analysis ADD CONSTRAINT fk_ai_progress_analysis_milestone_id_project_milestones FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.ai_progress_analysis ADD CONSTRAINT fk_ai_progress_analysis_progress_update_id_progress_updates FOREIGN KEY (progress_update_id) REFERENCES public.progress_updates(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.transactions ADD CONSTRAINT fk_transactions_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.transactions ADD CONSTRAINT fk_transactions_milestone_id_project_milestones FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.review_reports ADD CONSTRAINT fk_review_reports_review_id_reviews FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.jobs ADD CONSTRAINT fk_jobs_created_by_users FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.projects ADD CONSTRAINT fk_projects_owner_id_users FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.projects ADD CONSTRAINT fk_projects_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.saved_contractors ADD CONSTRAINT fk_saved_contractors_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.saved_contractors ADD CONSTRAINT fk_saved_contractors_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.bids ADD CONSTRAINT fk_bids_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.ai_timelines ADD CONSTRAINT fk_ai_timelines_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.uploads ADD CONSTRAINT fk_uploads_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.milestones ADD CONSTRAINT fk_milestones_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.disputes ADD CONSTRAINT fk_disputes_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.user_settings ADD CONSTRAINT fk_user_settings_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.documents ADD CONSTRAINT fk_documents_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.portfolio_items ADD CONSTRAINT fk_portfolio_items_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.messages ADD CONSTRAINT fk_messages_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.certifications ADD CONSTRAINT fk_certifications_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.dispute_responses ADD CONSTRAINT fk_dispute_responses_dispute_id_disputes FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.dispute_responses ADD CONSTRAINT fk_dispute_responses_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.job_applications ADD CONSTRAINT fk_job_applications_job_id_jobs FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.project_milestones ADD CONSTRAINT fk_project_milestones_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.endorsements ADD CONSTRAINT fk_endorsements_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.endorsements ADD CONSTRAINT fk_endorsements_endorsed_by_users FOREIGN KEY (endorsed_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.job_invites ADD CONSTRAINT fk_job_invites_job_id_jobs FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.project_milestones ADD CONSTRAINT fk_project_milestones_depends_on_project_milestones FOREIGN KEY (depends_on) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.job_invites ADD CONSTRAINT fk_job_invites_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.change_orders ADD CONSTRAINT fk_change_orders_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.change_orders ADD CONSTRAINT fk_change_orders_milestone_id_project_milestones FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.job_invites ADD CONSTRAINT fk_job_invites_invited_by_users FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.content_reports ADD CONSTRAINT fk_content_reports_reported_by_users FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.content_reports ADD CONSTRAINT fk_content_reports_reviewed_by_users FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.payouts ADD CONSTRAINT fk_payouts_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.profile_views ADD CONSTRAINT fk_profile_views_profile_id_users FOREIGN KEY (profile_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.profile_views ADD CONSTRAINT fk_profile_views_viewer_id_users FOREIGN KEY (viewer_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_job_id_jobs FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.conversations ADD CONSTRAINT fk_conversations_bid_id_bids FOREIGN KEY (bid_id) REFERENCES public.bids(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.conversation_participants ADD CONSTRAINT fk_conversation_participants_conversation_id_conversations FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.referrals ADD CONSTRAINT fk_referrals_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.support_ticket_messages ADD CONSTRAINT fk_support_ticket_messages_ticket_id_support_tickets FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.referral_uses ADD CONSTRAINT fk_referral_uses_referrer_id_users FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.referral_uses ADD CONSTRAINT fk_referral_uses_referred_user_id_users FOREIGN KEY (referred_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.video_consultations ADD CONSTRAINT fk_video_consultations_requester_id_users FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.video_consultations ADD CONSTRAINT fk_video_consultations_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.messages ADD CONSTRAINT fk_messages_conversation_id_conversations FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.message_templates ADD CONSTRAINT fk_message_templates_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.quotes ADD CONSTRAINT fk_quotes_contractor_id_users FOREIGN KEY (contractor_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.quotes ADD CONSTRAINT fk_quotes_client_id_users FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.user_badges ADD CONSTRAINT fk_user_badges_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.user_badges ADD CONSTRAINT fk_user_badges_badge_id_badges FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.user_badges ADD CONSTRAINT fk_user_badges_assigned_by_users FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.escrow_transactions ADD CONSTRAINT fk_escrow_transactions_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.escrow_transactions ADD CONSTRAINT fk_escrow_transactions_milestone_id_project_milestones FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.role_permissions ADD CONSTRAINT fk_role_permissions_role_id_roles FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.role_permissions ADD CONSTRAINT fk_role_permissions_permission_id_permissions FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.user_roles ADD CONSTRAINT fk_user_roles_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.user_roles ADD CONSTRAINT fk_user_roles_role_id_roles FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.user_roles ADD CONSTRAINT fk_user_roles_assigned_by_users FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.escrow_transactions ADD CONSTRAINT fk_escrow_transactions_deposited_by_users FOREIGN KEY (deposited_by) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.contractor_profiles ADD CONSTRAINT fk_contractor_profiles_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_project_id_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.admin_users ADD CONSTRAINT fk_admin_users_created_by_admin_users FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.verification_requests ADD CONSTRAINT fk_verification_requests_user_id_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.verification_requests ADD CONSTRAINT fk_verification_requests_reviewed_by_admin_users FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.audit_logs ADD CONSTRAINT fk_audit_logs_admin_id_admin_users FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL; END $$;

-- 5. TRIGGERS
DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trigger_update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION update_admin_users_updated_at();
DROP TRIGGER IF EXISTS set_bid_submissions_created_by ON public.bid_submissions;
CREATE TRIGGER set_bid_submissions_created_by BEFORE INSERT ON public.bid_submissions FOR EACH ROW EXECUTE FUNCTION set_bid_submissions_created_by();
DROP TRIGGER IF EXISTS update_bids_modtime ON public.bids;
CREATE TRIGGER update_bids_modtime BEFORE UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_update_bids_updated_at ON public.bids;
CREATE TRIGGER trg_update_bids_updated_at BEFORE UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION update_bids_updated_at();
DROP TRIGGER IF EXISTS update_certifications_updated_at ON public.certifications;
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON public.portfolio_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_projects_modtime ON public.projects;
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_roles_updated_at_trigger ON public.roles;
CREATE TRIGGER update_roles_updated_at_trigger BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_roles_updated_at();
DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.support_tickets;
CREATE TRIGGER trigger_set_ticket_number BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION set_ticket_number();
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trigger_update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_support_tickets_updated_at();
DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trigger_update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_system_settings_updated_at();
DROP TRIGGER IF EXISTS update_transaction_modtime ON public.transactions;
CREATE TRIGGER update_transaction_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_users_modtime ON public.users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_verification_requests_updated_at ON public.verification_requests;
CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON public.verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();