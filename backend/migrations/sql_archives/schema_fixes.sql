-- ============================================
-- BACKEND SCHEMA FIXES
-- Auto-generated from codebase scan
-- Generated: 2025-12-03T17:09:19.648Z
-- ============================================

-- Create table: contractor_profiles
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  undefined TEXT,
  specialties TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table: admin_logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  undefined TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table: appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  undefined TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table: conversation_participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  undefined TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table: blocked_ips
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  undefined TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing column: bids.undefined
ALTER TABLE bids ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: bid_submissions.undefined
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: reviews.undefined
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: profiles.undefined
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: jobs.undefined
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: roles.undefined
ALTER TABLE roles ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: sessions.undefined
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: login_logs.undefined
ALTER TABLE login_logs ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: failed_logins.undefined
ALTER TABLE failed_logins ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: password_reset_logs.undefined
ALTER TABLE password_reset_logs ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: job_applications.undefined
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: projects.undefined
ALTER TABLE projects ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: projects.last_update_at
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMP WITH TIME ZONE;

-- Add missing column: project_milestones.undefined
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: disputes.undefined
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: payments.undefined
ALTER TABLE payments ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: payouts.undefined
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: conversations.undefined
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: conversations.last_message_at
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

-- Add missing column: messages.undefined
ALTER TABLE messages ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: dispute_messages.undefined
ALTER TABLE dispute_messages ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: role_permissions.undefined
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: notifications.undefined
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: notifications.user_id
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add missing column: device_tokens.undefined
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: device_tokens.id
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS id UUID;

-- Add missing column: progress_updates.undefined
ALTER TABLE progress_updates ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Add missing column: admin_activity_logs.undefined
ALTER TABLE admin_activity_logs ADD COLUMN IF NOT EXISTS undefined TEXT;

-- Index: bid_submissions.created_by
CREATE INDEX IF NOT EXISTS idx_bid_submissions_created_by ON bid_submissions(created_by);

-- Index: roles.id
CREATE INDEX IF NOT EXISTS idx_roles_id ON roles(id);

-- Index: sessions.id
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);

-- Index: projects.id
CREATE INDEX IF NOT EXISTS idx_projects_id ON projects(id);

-- Index: project_milestones.project_id
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);

-- Index: conversation_participants.user_id
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Index: notifications.user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index: device_tokens.id
CREATE INDEX IF NOT EXISTS idx_device_tokens_id ON device_tokens(id);

