-- Roles and Permissions Tables
-- Execute this AFTER schema_complete.sql

-- ==========================================
-- ROLES & PERMISSIONS SYSTEM
-- ==========================================

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- System roles can't be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(50), -- e.g., 'users', 'jobs', 'projects', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-Permission Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- User-Role Mapping (if users can have multiple roles)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

-- ==========================================
-- INSERT DEFAULT ROLES
-- ==========================================

INSERT INTO roles (name, code, description, is_system_role) VALUES
  ('Super Admin', 'super_admin', 'Full system access with all permissions', true),
  ('Admin', 'admin', 'Administrative access to manage platform', true),
  ('Finance Manager', 'finance_manager', 'Manage financial operations and transactions', true),
  ('Moderator', 'moderator', 'Content moderation and user management', true),
  ('Support Agent', 'support_agent', 'Customer support and ticket management', true),
  ('General Contractor', 'general_contractor', 'General contractor with full project management', true),
  ('Project Manager', 'project_manager', 'Project management and oversight', true),
  ('Subcontractor', 'subcontractor', 'Subcontractor with limited project access', true),
  ('Trade Specialist', 'trade_specialist', 'Specialized trade professional', true),
  ('Viewer', 'viewer', 'Read-only access', true)
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- INSERT DEFAULT PERMISSIONS
-- ==========================================

-- Admin Permissions
INSERT INTO permissions (name, code, description, module) VALUES
  -- User Management
  ('View Users', 'admin.users.view', 'View all users', 'admin'),
  ('Create Users', 'admin.users.create', 'Create new users', 'admin'),
  ('Edit Users', 'admin.users.edit', 'Edit user details', 'admin'),
  ('Delete Users', 'admin.users.delete', 'Delete users', 'admin'),
  ('Suspend Users', 'admin.users.suspend', 'Suspend/unsuspend users', 'admin'),
  ('Verify Users', 'admin.users.verify', 'Verify user accounts', 'admin'),
  ('Change User Roles', 'admin.users.change_role', 'Change user roles', 'admin'),
  
  -- Project Management
  ('View All Projects', 'admin.projects.view', 'View all projects', 'admin'),
  ('Edit Projects', 'admin.projects.edit', 'Edit project details', 'admin'),
  ('Delete Projects', 'admin.projects.delete', 'Delete projects', 'admin'),
  ('Manage Milestones', 'admin.projects.milestones', 'Manage project milestones', 'admin'),
  
  -- Job Management
  ('View All Jobs', 'admin.jobs.view', 'View all jobs', 'admin'),
  ('Edit Jobs', 'admin.jobs.edit', 'Edit job details', 'admin'),
  ('Delete Jobs', 'admin.jobs.delete', 'Delete jobs', 'admin'),
  ('Feature Jobs', 'admin.jobs.feature', 'Feature/unfeature jobs', 'admin'),
  
  -- Financial Management
  ('View Transactions', 'admin.finance.transactions.view', 'View all transactions', 'admin'),
  ('Manage Escrow', 'admin.finance.escrow.manage', 'Manage escrow accounts', 'admin'),
  ('Process Payouts', 'admin.finance.payouts.process', 'Process contractor payouts', 'admin'),
  ('View Financial Reports', 'admin.finance.reports.view', 'View financial reports', 'admin'),
  ('Manage Refunds', 'admin.finance.refunds.manage', 'Process refunds', 'admin'),
  
  -- Dispute Management
  ('View Disputes', 'admin.disputes.view', 'View all disputes', 'admin'),
  ('Manage Disputes', 'admin.disputes.manage', 'Manage and resolve disputes', 'admin'),
  ('Assign Mediators', 'admin.disputes.assign', 'Assign mediators to disputes', 'admin'),
  
  -- Support Management
  ('View Tickets', 'admin.support.tickets.view', 'View support tickets', 'admin'),
  ('Manage Tickets', 'admin.support.tickets.manage', 'Manage support tickets', 'admin'),
  ('Assign Tickets', 'admin.support.tickets.assign', 'Assign tickets to agents', 'admin'),
  
  -- Content Moderation
  ('View Reports', 'admin.moderation.reports.view', 'View content reports', 'admin'),
  ('Moderate Content', 'admin.moderation.content.manage', 'Moderate flagged content', 'admin'),
  ('Ban Users', 'admin.moderation.users.ban', 'Ban users for violations', 'admin'),
  
  -- Verification Management
  ('View Verifications', 'admin.verification.view', 'View verification requests', 'admin'),
  ('Approve Verifications', 'admin.verification.approve', 'Approve verification requests', 'admin'),
  ('Reject Verifications', 'admin.verification.reject', 'Reject verification requests', 'admin'),
  
  -- Analytics & Reports
  ('View Analytics', 'admin.analytics.view', 'View platform analytics', 'admin'),
  ('Generate Reports', 'admin.reports.generate', 'Generate custom reports', 'admin'),
  ('Export Data', 'admin.data.export', 'Export platform data', 'admin'),
  
  -- System Settings
  ('View Settings', 'admin.settings.view', 'View system settings', 'admin'),
  ('Edit Settings', 'admin.settings.edit', 'Edit system settings', 'admin'),
  ('Manage Roles', 'admin.roles.manage', 'Manage roles and permissions', 'admin'),
  
  -- Audit & Security
  ('View Audit Logs', 'admin.audit.view', 'View audit logs', 'admin'),
  ('Manage Security', 'admin.security.manage', 'Manage security settings', 'admin'),
  
  -- User Permissions (for regular users)
  ('Create Jobs', 'jobs.create', 'Create job postings', 'jobs'),
  ('Edit Own Jobs', 'jobs.edit.own', 'Edit own job postings', 'jobs'),
  ('Delete Own Jobs', 'jobs.delete.own', 'Delete own job postings', 'jobs'),
  ('View Jobs', 'jobs.view', 'View job postings', 'jobs'),
  ('Apply to Jobs', 'jobs.apply', 'Apply to job postings', 'jobs'),
  
  ('Create Bids', 'bids.create', 'Create bids', 'bids'),
  ('Edit Own Bids', 'bids.edit.own', 'Edit own bids', 'bids'),
  ('View Bids', 'bids.view', 'View bids', 'bids'),
  
  ('Create Projects', 'projects.create', 'Create projects', 'projects'),
  ('Edit Own Projects', 'projects.edit.own', 'Edit own projects', 'projects'),
  ('View Projects', 'projects.view', 'View projects', 'projects'),
  
  ('Send Messages', 'messages.send', 'Send messages', 'messages'),
  ('View Messages', 'messages.view', 'View messages', 'messages'),
  
  ('Create Reviews', 'reviews.create', 'Create reviews', 'reviews'),
  ('Edit Own Reviews', 'reviews.edit.own', 'Edit own reviews', 'reviews'),
  ('View Reviews', 'reviews.view', 'View reviews', 'reviews')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- ASSIGN PERMISSIONS TO ROLES
-- ==========================================

-- Super Admin - ALL PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin - Most admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.module IN ('admin', 'jobs', 'projects', 'bids', 'messages', 'reviews')
  AND p.code NOT IN ('admin.users.delete', 'admin.settings.edit', 'admin.roles.manage')
ON CONFLICT DO NOTHING;

-- Finance Manager - Financial permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'finance_manager'
  AND (p.code LIKE 'admin.finance%' OR p.code IN ('admin.analytics.view', 'admin.reports.generate'))
ON CONFLICT DO NOTHING;

-- Moderator - Moderation permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'moderator'
  AND (p.code LIKE 'admin.moderation%' OR p.code LIKE 'admin.users.view%' OR p.code = 'admin.users.suspend')
ON CONFLICT DO NOTHING;

-- Support Agent - Support permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'support_agent'
  AND (p.code LIKE 'admin.support%' OR p.code = 'admin.users.view')
ON CONFLICT DO NOTHING;

-- Contractors - User permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('general_contractor', 'subcontractor', 'trade_specialist')
  AND p.module IN ('jobs', 'bids', 'projects', 'messages', 'reviews')
  AND p.code NOT LIKE 'admin%'
ON CONFLICT DO NOTHING;

-- Project Manager - Project permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'project_manager'
  AND p.module IN ('jobs', 'projects', 'messages', 'reviews')
  AND p.code NOT LIKE 'admin%'
ON CONFLICT DO NOTHING;

-- Viewer - Read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'viewer'
  AND p.code IN ('jobs.view', 'projects.view', 'bids.view', 'reviews.view')
ON CONFLICT DO NOTHING;

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can view roles and permissions
DROP POLICY IF EXISTS "Anyone can view roles" ON roles;
CREATE POLICY "Anyone can view roles" ON roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view permissions" ON permissions;
CREATE POLICY "Anyone can view permissions" ON permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view role permissions" ON role_permissions;
CREATE POLICY "Anyone can view role permissions" ON role_permissions FOR SELECT USING (true);

-- Only admins can modify roles and permissions
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "Admins can manage roles" ON roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
CREATE POLICY "Admins can manage permissions" ON permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update updated_at on roles
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_roles_updated_at_trigger ON roles;
CREATE TRIGGER update_roles_updated_at_trigger
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- View all roles
SELECT * FROM roles ORDER BY name;

-- View all permissions by module
SELECT module, COUNT(*) as permission_count
FROM permissions
GROUP BY module
ORDER BY module;

-- View permissions for a specific role
SELECT r.name as role_name, p.name as permission_name, p.code, p.module
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'admin'
ORDER BY p.module, p.name;

-- Count permissions per role
SELECT r.name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY permission_count DESC;
