-- Fix RLS policies for project_milestones
-- Allows Admins and Project Participants to create milestones

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- 1. INSERT Policy
DROP POLICY IF EXISTS "Users can create milestones" ON project_milestones;
CREATE POLICY "Users can create milestones" ON project_milestones FOR INSERT WITH CHECK (
  -- Allow Project Owner or Contractor
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_milestones.project_id
    AND (
      projects.owner_id = auth.uid() OR
      projects.contractor_id = auth.uid()
    )
  )
  OR
  -- Allow Admins
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 2. SELECT Policy
DROP POLICY IF EXISTS "Users can view milestones" ON project_milestones;
CREATE POLICY "Users can view milestones" ON project_milestones FOR SELECT USING (true);

-- 3. UPDATE/DELETE (Optional but good to have)
DROP POLICY IF EXISTS "Admins can manage milestones" ON project_milestones;
CREATE POLICY "Admins can manage milestones" ON project_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
