-- ============================================
-- COMPLETE SCHEMA FIXES MIGRATION
-- Auto-generated from comprehensive schema verification
-- Generated: 2025-12-03T17:25:00.000Z
-- Source: Provided Supabase Database Schema
-- ============================================

-- ============================================
-- PART 1: ADD MISSING COLUMNS
-- ============================================

-- Fix 1: Add MFA-related columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_otp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_otp_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_temp_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_temp_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_block_until TIMESTAMP WITH TIME ZONE;

-- Fix 2: Add missing columns to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Fix 3: Add project_id to bid_submissions (if needed for stats)
ALTER TABLE bid_submissions ADD COLUMN IF NOT EXISTS project_id UUID;
-- Add foreign key constraint if project_id should reference projects
-- ALTER TABLE bid_submissions ADD CONSTRAINT fk_bid_submissions_project_id FOREIGN KEY (project_id) REFERENCES projects(id);

-- Fix 4: Add contractor_id to project_milestones (if needed for stats)
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS contractor_id UUID;
-- Add foreign key constraint if contractor_id should reference profiles
-- NOTE: Using profiles(id) as primary key, not profiles(user_id)
-- ALTER TABLE project_milestones ADD CONSTRAINT fk_project_milestones_contractor_id FOREIGN KEY (contractor_id) REFERENCES profiles(id);

-- Fix 5: Add last_update_at to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_update_at TIMESTAMP WITH TIME ZONE;

-- Fix 6: Add processed_at to payouts table
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Fix 7: Add order_number to progress_updates table
ALTER TABLE progress_updates ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- Fix 8: Add type to notifications table (if needed)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- ============================================
-- PART 2: CREATE MISSING TABLES
-- ============================================

-- Fix 9: Create appointments table (if appointments feature is needed)
-- NOTE: If table already exists with wrong foreign keys, you need to:
-- 1. Drop foreign key constraints first: ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_created_by_fkey;
-- 2. Then recreate with correct references, OR
-- 3. Drop and recreate table if no data exists: DROP TABLE IF EXISTS appointments CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    CREATE TABLE appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id),
      created_by UUID REFERENCES profiles(id),
      attendee_id UUID REFERENCES profiles(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) DEFAULT 'scheduled',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Table exists - fix foreign keys if they're wrong
    -- Drop existing foreign key constraints that reference profiles(user_id)
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_created_by_fkey;
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_attendee_id_fkey;
    
    -- Recreate with correct references to profiles(id)
    ALTER TABLE appointments ADD CONSTRAINT appointments_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES profiles(id);
    ALTER TABLE appointments ADD CONSTRAINT appointments_attendee_id_fkey 
      FOREIGN KEY (attendee_id) REFERENCES profiles(id);
  END IF;
END $$;

-- ============================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_attendee_id ON appointments(attendee_id);
CREATE INDEX IF NOT EXISTS idx_appointments_project_id ON appointments(project_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Indexes for profiles MFA columns
CREATE INDEX IF NOT EXISTS idx_profiles_mfa_temp_token ON profiles(mfa_temp_token) WHERE mfa_temp_token IS NOT NULL;

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at) WHERE last_message_at IS NOT NULL;

-- Indexes for bid_submissions
CREATE INDEX IF NOT EXISTS idx_bid_submissions_project_id ON bid_submissions(project_id) WHERE project_id IS NOT NULL;

-- Indexes for project_milestones
CREATE INDEX IF NOT EXISTS idx_project_milestones_contractor_id ON project_milestones(contractor_id) WHERE contractor_id IS NOT NULL;

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_last_update_at ON projects(last_update_at) WHERE last_update_at IS NOT NULL;

-- Indexes for payouts
CREATE INDEX IF NOT EXISTS idx_payouts_processed_at ON payouts(processed_at) WHERE processed_at IS NOT NULL;

-- Indexes for progress_updates
CREATE INDEX IF NOT EXISTS idx_progress_updates_order_number ON progress_updates(order_number) WHERE order_number IS NOT NULL;

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type) WHERE type IS NOT NULL;

-- ============================================
-- PART 4: NOTES AND WARNINGS
-- ============================================

-- IMPORTANT NOTES:
-- 1. The 'admin_logs' table referenced in code should be changed to 'admin_activity_logs'
--    This requires CODE changes, not SQL changes.
--
-- 2. The 'mfa_enabled' column referenced in code should use 'two_factor_enabled' instead
--    This column already exists in the profiles table.
--
-- 3. The 'device_token' column referenced in code should use 'token' instead
--    This column already exists in the device_tokens table.
--
-- 4. The 'amount' column referenced in projects should use 'budget' instead
--    This column already exists in the projects table.
--
-- 5. Review all foreign key constraints before uncommenting them.
--    Ensure referential integrity is maintained.

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Verify all columns were added:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('profiles', 'conversations', 'bid_submissions', 'project_milestones', 'projects', 'payouts', 'progress_updates', 'notifications', 'appointments')
-- ORDER BY table_name, column_name;

-- ============================================
-- END OF MIGRATION
-- ============================================

