-- ==============================================================================
-- EXTRA TABLES (For Full Project Completeness)
-- These tables are not currently used by the Backend API but added for metadata/future features.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title character varying NOT NULL,
  content text NOT NULL,
  type character varying DEFAULT 'info',
  target_audience character varying,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  created_by uuid,
  attendee_id uuid,
  title character varying NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  status character varying DEFAULT 'scheduled',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  icon_url text,
  criteria jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  ip text NOT NULL,
  reason text,
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT blocked_ips_pkey PRIMARY KEY (ip)
);

CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  name character varying NOT NULL,
  issuing_organization character varying NOT NULL,
  issue_date date,
  expiry_date date,
  credential_id character varying,
  credential_url text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.change_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  milestone_id uuid,
  requested_by uuid NOT NULL,
  requested_to uuid NOT NULL,
  title character varying NOT NULL,
  description text NOT NULL,
  cost_impact numeric DEFAULT 0,
  timeline_impact_days integer DEFAULT 0,
  documents text[] DEFAULT '{}',
  status character varying DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamp with time zone,
  rejected_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT change_orders_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  content_type character varying NOT NULL,
  content_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason character varying NOT NULL,
  description text,
  status character varying DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  action_taken character varying,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  resolution_notes text,
  CONSTRAINT content_reports_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.contractor_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  verification_type character varying NOT NULL,
  document_url text,
  verification_status character varying DEFAULT 'pending',
  verified_by uuid,
  verified_at timestamp with time zone,
  admin_notes text,
  rejection_reason text,
  expiry_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contractor_verifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.ddos_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ip text NOT NULL,
  endpoint text NOT NULL,
  count integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ddos_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT device_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  dispute_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachments text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dispute_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.dispute_responses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  dispute_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  evidence text[],
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dispute_responses_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid,
  uploaded_by uuid,
  url text,
  type text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  subject character varying NOT NULL,
  content text NOT NULL,
  target_segment jsonb,
  status character varying DEFAULT 'draft',
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  recipients_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_campaigns_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.endorsements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  endorsed_by uuid NOT NULL,
  skill character varying NOT NULL,
  message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT endorsements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  milestone_id uuid,
  amount numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'held',
  stripe_payment_intent_id character varying,
  stripe_transfer_id character varying,
  deposited_by uuid NOT NULL,
  deposited_at timestamp with time zone,
  released_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT escrow_transactions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.failed_logins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamp with time zone DEFAULT now(),
  locked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT failed_logins_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.job_invites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  message text,
  status character varying DEFAULT 'pending',
  responded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_invites_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.login_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  email_attempted text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  reason text,
  ip_address text,
  user_agent text,
  device text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  content text NOT NULL,
  category character varying DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT message_templates_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  content text NOT NULL,
  type character varying DEFAULT 'info',
  is_read boolean DEFAULT false,
  read_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.password_reset_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean DEFAULT false,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT password_reset_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  project_id uuid,
  amount numeric NOT NULL,
  status character varying DEFAULT 'pending',
  stripe_account_id text,
  processor_payout_id text,
  failure_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  payment_id uuid,
  processed_at timestamp with time zone,
  CONSTRAINT payouts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  code character varying NOT NULL UNIQUE,
  description text,
  module character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  images text[] NOT NULL,
  project_type character varying,
  completion_date date,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  viewer_id uuid,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_views_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  client_id uuid NOT NULL,
  project_title character varying NOT NULL,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  valid_until date,
  notes text,
  status character varying DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quotes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.referral_uses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  referral_code character varying NOT NULL,
  status character varying DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referral_uses_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  referral_code character varying NOT NULL UNIQUE,
  total_referrals integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  report_type character varying NOT NULL,
  related_id uuid,
  reason character varying NOT NULL,
  description text,
  status character varying DEFAULT 'pending',
  moderator_id uuid,
  moderator_action character varying,
  moderator_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.review_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  review_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status character varying DEFAULT 'pending',
  moderator_id uuid,
  moderator_notes text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT review_reports_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  code character varying NOT NULL UNIQUE,
  description text,
  is_system_role boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.saved_contractors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_contractors_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  refresh_token text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp without time zone DEFAULT now(),
  expires_at timestamp without time zone,
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL,
  sender_id uuid,
  message text NOT NULL,
  attachments text[] DEFAULT '{}',
  internal_only boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_number character varying NOT NULL UNIQUE,
  user_id uuid,
  assigned_to uuid,
  subject character varying NOT NULL,
  description text NOT NULL,
  category character varying NOT NULL,
  priority character varying DEFAULT 'normal',
  status character varying DEFAULT 'open',
  resolution text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  key character varying NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  group_name character varying DEFAULT 'general',
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT typing_indicators_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.uploads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  file_name character varying NOT NULL,
  file_type character varying NOT NULL,
  file_size integer NOT NULL,
  upload_type character varying NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  thumbnail_url text,
  related_id uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT uploads_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  expiry_date timestamp with time zone,
  CONSTRAINT user_badges_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid,
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  language character varying DEFAULT 'en',
  timezone character varying DEFAULT 'America/Los_Angeles',
  privacy_profile_visible boolean DEFAULT true,
  privacy_show_email boolean DEFAULT false,
  privacy_show_phone boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.video_consultations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  requester_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  requested_date timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 30,
  topic character varying,
  description text,
  status character varying DEFAULT 'pending',
  meeting_link text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_consultations_pkey PRIMARY KEY (id)
);
