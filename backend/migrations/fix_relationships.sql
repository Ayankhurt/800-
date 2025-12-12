-- Fix Relationship Names for API Compatibility

-- CLEANUP ORPHANED DATA (To fix FK violations)

-- 1. Clean up dependent tables for Orphaned JOBS
-- Messages -> Conversations -> Jobs
DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE job_id IN (SELECT id FROM jobs WHERE created_by NOT IN (SELECT id FROM users)));
DELETE FROM conversation_participants WHERE conversation_id IN (SELECT id FROM conversations WHERE job_id IN (SELECT id FROM jobs WHERE created_by NOT IN (SELECT id FROM users)));
DELETE FROM conversations WHERE job_id IN (SELECT id FROM jobs WHERE created_by NOT IN (SELECT id FROM users));

DELETE FROM job_applications WHERE job_id IN (SELECT id FROM jobs WHERE created_by NOT IN (SELECT id FROM users));
DELETE FROM job_invites WHERE job_id IN (SELECT id FROM jobs WHERE created_by NOT IN (SELECT id FROM users));
DELETE FROM notifications WHERE job_id IN (SELECT id FROM jobs WHERE created_by NOT IN (SELECT id FROM users));

-- Now delete the orphaned jobs
DELETE FROM jobs WHERE created_by NOT IN (SELECT id FROM users);

-- 2. Clean up dependent tables for Orphaned PROJECTS
-- Messages -> Conversations -> Projects
DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users)));
DELETE FROM conversation_participants WHERE conversation_id IN (SELECT id FROM conversations WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users)));
DELETE FROM conversations WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));

DELETE FROM progress_updates WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM change_orders WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM transactions WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM payouts WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));

DELETE FROM project_milestones WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM milestones WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));

DELETE FROM disputes WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM reviews WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM notifications WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM documents WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM assignments WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM appointments WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM bids WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));
DELETE FROM bid_submissions WHERE project_id IN (SELECT id FROM projects WHERE owner_id NOT IN (SELECT id FROM users));

-- Now delete the orphaned projects
DELETE FROM projects WHERE owner_id NOT IN (SELECT id FROM users);


-- APPLY CONSTRAINTS
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_created_by_fkey;
ALTER TABLE jobs ADD CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_contractor_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES users(id);

-- Ensure user_settings exists (just in case)
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
