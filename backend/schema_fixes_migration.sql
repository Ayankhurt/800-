-- ============================================
-- SCHEMA FIXES MIGRATION
-- Auto-generated from codebase verification
-- Generated: 2025-12-03T17:21:28.407Z
-- ============================================

-- Add missing column: profiles.locked_reason
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_reason TEXT;

-- Add missing column: profiles.mfa_otp
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_otp TEXT;

-- Add missing column: profiles.mfa_otp_expires_at
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_otp_expires_at TIMESTAMP WITH TIME ZONE;

-- Add missing column: profiles.mfa_temp_token
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_temp_token VARCHAR(255);

-- Add missing column: profiles.mfa_attempts
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_attempts TIMESTAMP WITH TIME ZONE;

-- Add missing column: profiles.mfa_temp_refresh_token
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_temp_refresh_token VARCHAR(255);

-- Add missing column: profiles.reset_block_until
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_block_until TEXT;

-- Add missing column: profiles.mfa_enabled
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;

-- Add missing column: bid_submissions.project_id
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS project_id UUID;

-- Add missing column: project_milestones.contractor_id
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS contractor_id UUID;

-- Add missing column: projects.amount
ALTER TABLE projects ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);

-- Add missing column: conversations.last_message_at
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

-- Add missing column: conversations.updated_at
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add missing column: device_tokens.device_token
ALTER TABLE device_tokens ADD COLUMN IF NOT EXISTS device_token VARCHAR(255);

-- Add missing column: payouts.processed_at
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Add missing column: projects.last_update_at
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMP WITH TIME ZONE;

-- Add missing column: progress_updates.order_number
ALTER TABLE progress_updates ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Add missing column: notifications.type
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Rename column: profiles.verified_at → email_verified
-- NOTE: Manual review required - this may break existing data
-- ALTER TABLE profiles RENAME COLUMN verified_at TO email_verified;

