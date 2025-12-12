-- Create missing admin tables
-- Execute this to enable full admin panel functionality

-- ==========================================
-- SUPPORT TICKETS
-- ==========================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CONTENT REPORTS
-- ==========================================
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  content_type VARCHAR(50) NOT NULL, -- job, bid, project, message, user
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SYSTEM SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description TEXT,
  group_name VARCHAR(50) DEFAULT 'general',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description, group_name) VALUES
  ('site_name', 'BidRoom', 'Platform name', 'general'),
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'general'),
  ('allow_registration', 'true', 'Allow new user registration', 'auth'),
  ('platform_fee_percent', '5', 'Platform fee percentage', 'finance'),
  ('min_withdrawal_amount', '50', 'Minimum withdrawal amount', 'finance')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- ADMIN ACTIVITY LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action);

-- ==========================================
-- RLS POLICIES
-- ==========================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Support Tickets: Users can view their own, Admins view all
CREATE POLICY "Users view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'support_agent')));

CREATE POLICY "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content Reports: Admins view all, Users create
CREATE POLICY "Admins view reports" ON content_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator')));

CREATE POLICY "Users create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- System Settings: Admins view/edit, others view public settings (if needed)
CREATE POLICY "Admins manage settings" ON system_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Admin Logs: Admins view only
CREATE POLICY "Admins view logs" ON admin_activity_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
