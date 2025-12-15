-- Simple INSERT for testing disputes
-- Run this in Supabase SQL Editor

-- First check if we have projects
-- If not, we need to create at least one project

-- Get first user and create a sample project if needed
DO $$
DECLARE
    v_user_id UUID;
    v_project_id UUID;
BEGIN
    -- Get any user
    SELECT id INTO v_user_id FROM users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No users found. Cannot create disputes.';
        RETURN;
    END IF;
    
    -- Check if project exists
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    
    -- If no project, create one
    IF v_project_id IS NULL THEN
        INSERT INTO projects (owner_id, contractor_id, title, description, status, total_amount)
        VALUES (v_user_id, v_user_id, 'Sample Project', 'Test project for disputes', 'active', 10000)
        RETURNING id INTO v_project_id;
        RAISE NOTICE 'Created sample project: %', v_project_id;
    END IF;
    
    -- Now insert sample disputes
    INSERT INTO disputes (project_id, raised_by, reason, description, status, created_at)
    VALUES 
        (v_project_id, v_user_id, 'Payment delay', 'The contractor has not received payment for completed milestone.', 'open', NOW() - INTERVAL '3 days'),
        (v_project_id, v_user_id, 'Quality concerns', 'The delivered work does not meet the agreed specifications.', 'under_review', NOW() - INTERVAL '7 days'),
        (v_project_id, v_user_id, 'Scope disagreement', 'Disagreement about the scope of work required.', 'open', NOW() - INTERVAL '1 day'),
        (v_project_id, v_user_id, 'Timeline extension', 'Request for timeline extension due to unforeseen circumstances.', 'resolved', NOW() - INTERVAL '14 days'),
        (v_project_id, v_user_id, 'Contract violation', 'The other party has violated terms of the contract.', 'open', NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted sample disputes for project: %', v_project_id;
END $$;

-- Verify what we have
SELECT 
    d.id,
    d.reason,
    d.status::text,
    d.created_at,
    p.title as project_title
FROM disputes d
LEFT JOIN projects p ON d.project_id = p.id
ORDER BY d.created_at DESC;
