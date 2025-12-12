-- Fix RLS Policies for Notifications
-- Run this in Supabase SQL Editor

-- First, drop existing policies if any
DROP POLICY IF EXISTS notifications_select_own ON notifications;
DROP POLICY IF EXISTS notifications_update_own ON notifications;
DROP POLICY IF EXISTS notifications_insert_admin ON notifications;
DROP POLICY IF EXISTS notifications_delete_admin ON notifications;

-- Disable RLS temporarily to test
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Test insert (should work now)
-- Try sending notification from admin panel

-- If it works, re-enable RLS with proper policies:
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own notifications
CREATE POLICY notifications_select_own ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy 2: Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Policy 3: Admins can insert notifications for anyone
CREATE POLICY notifications_insert_admin ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy 4: Users can delete their own notifications
CREATE POLICY notifications_delete_own ON notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- Policy 5: Admins can delete any notification
CREATE POLICY notifications_delete_admin ON notifications
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- Test query
SELECT COUNT(*) FROM notifications;
