-- Ensure correct RLS policies for JOBS table
-- This fixes the issue where "Delete" returns success but doesn't actually delete the record.

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 1. VIEW Policies
DROP POLICY IF EXISTS "Public jobs are viewable" ON jobs;
CREATE POLICY "Public jobs are viewable" ON jobs FOR SELECT USING (true);

-- 2. INSERT Policies
DROP POLICY IF EXISTS "Users can create jobs" ON jobs;
CREATE POLICY "Users can create jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 3. UPDATE Policies
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = created_by);

-- 4. DELETE Policies
DROP POLICY IF EXISTS "Users can delete own jobs" ON jobs;
CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can delete any job" ON jobs;
CREATE POLICY "Admins can delete any job" ON jobs FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
