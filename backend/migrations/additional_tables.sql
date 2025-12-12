-- Additional tables for complete functionality
-- Note: job_applications already exists in schema_complete.sql

-- Saved/Favorite Contractors
CREATE TABLE IF NOT EXISTS saved_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contractor_id)
);

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
  privacy_profile_visible BOOLEAN DEFAULT true,
  privacy_show_email BOOLEAN DEFAULT false,
  privacy_show_phone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio Items
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  images TEXT[] NOT NULL,
  project_type VARCHAR(100),
  completion_date DATE,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255) NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification Requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) NOT NULL, -- identity, license, insurance, background_check
  documents TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Responses
CREATE TABLE IF NOT EXISTS dispute_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  evidence TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Endorsements
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endorsed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill VARCHAR(100) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contractor_id, endorsed_by, skill)
);

-- Job Invites
CREATE TABLE IF NOT EXISTS job_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,
  reported_by UUID NOT NULL REFERENCES users(id),
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken VARCHAR(100),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile Views
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Uses
CREATE TABLE IF NOT EXISTS referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_user_id UUID NOT NULL REFERENCES users(id),
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, rewarded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Consultations
CREATE TABLE IF NOT EXISTS video_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id),
  contractor_id UUID NOT NULL REFERENCES users(id),
  requested_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  topic VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, cancelled, completed
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES users(id),
  client_id UUID NOT NULL REFERENCES users(id),
  project_title VARCHAR(255) NOT NULL,
  items JSONB NOT NULL, -- Array of {description, quantity, unit_price, total}
  total_amount DECIMAL(12, 2) NOT NULL,
  valid_until DATE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_contractors_user_id ON saved_contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_contractors_contractor_id ON saved_contractors(contractor_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_contractor_id ON portfolio_items(contractor_id);
CREATE INDEX IF NOT EXISTS idx_certifications_contractor_id ON certifications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_dispute_responses_dispute_id ON dispute_responses(dispute_id);

CREATE INDEX IF NOT EXISTS idx_endorsements_contractor_id ON endorsements(contractor_id);
CREATE INDEX IF NOT EXISTS idx_job_invites_contractor_id ON job_invites(contractor_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contractor_id ON quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
        CREATE TRIGGER update_user_settings_updated_at
        BEFORE UPDATE ON user_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_portfolio_items_updated_at') THEN
        CREATE TRIGGER update_portfolio_items_updated_at
        BEFORE UPDATE ON portfolio_items
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_certifications_updated_at') THEN
        CREATE TRIGGER update_certifications_updated_at
        BEFORE UPDATE ON certifications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_verification_requests_updated_at') THEN
        CREATE TRIGGER update_verification_requests_updated_at
        BEFORE UPDATE ON verification_requests
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_quotes_updated_at') THEN
        CREATE TRIGGER update_quotes_updated_at
        BEFORE UPDATE ON quotes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS Policies
ALTER TABLE saved_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Saved contractors policies
DROP POLICY IF EXISTS "Users can manage their saved contractors" ON saved_contractors;
CREATE POLICY "Users can manage their saved contractors" ON saved_contractors
  FOR ALL USING (user_id = auth.uid());

-- User settings policies
DROP POLICY IF EXISTS "Users can manage their settings" ON user_settings;
CREATE POLICY "Users can manage their settings" ON user_settings
  FOR ALL USING (user_id = auth.uid());

-- Portfolio items policies
DROP POLICY IF EXISTS "Anyone can view portfolio items" ON portfolio_items;
CREATE POLICY "Anyone can view portfolio items" ON portfolio_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contractors can manage their portfolio" ON portfolio_items;
CREATE POLICY "Contractors can manage their portfolio" ON portfolio_items
  FOR ALL USING (contractor_id = auth.uid());

-- Certifications policies
DROP POLICY IF EXISTS "Anyone can view certifications" ON certifications;
CREATE POLICY "Anyone can view certifications" ON certifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Contractors can manage their certifications" ON certifications;
CREATE POLICY "Contractors can manage their certifications" ON certifications
  FOR ALL USING (contractor_id = auth.uid());

-- Verification requests policies
DROP POLICY IF EXISTS "Users can view their verification requests" ON verification_requests;
CREATE POLICY "Users can view their verification requests" ON verification_requests
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
CREATE POLICY "Users can create verification requests" ON verification_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Dispute responses policies
DROP POLICY IF EXISTS "Users can view dispute responses" ON dispute_responses;
CREATE POLICY "Users can view dispute responses" ON dispute_responses
  FOR SELECT USING (
    dispute_id IN (
      SELECT id FROM disputes WHERE 
        raised_by = auth.uid() OR 
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid() OR contractor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create dispute responses" ON dispute_responses;
CREATE POLICY "Users can create dispute responses" ON dispute_responses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Endorsements policies
DROP POLICY IF EXISTS "Anyone can view endorsements" ON endorsements;
CREATE POLICY "Anyone can view endorsements" ON endorsements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create endorsements" ON endorsements;
CREATE POLICY "Users can create endorsements" ON endorsements
  FOR INSERT WITH CHECK (endorsed_by = auth.uid());

-- Job invites policies
DROP POLICY IF EXISTS "Users can view their invites" ON job_invites;
CREATE POLICY "Users can view their invites" ON job_invites
  FOR SELECT USING (contractor_id = auth.uid() OR invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can create invites" ON job_invites;
CREATE POLICY "Users can create invites" ON job_invites
  FOR INSERT WITH CHECK (invited_by = auth.uid());

-- Content reports policies
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (reported_by = auth.uid());

-- Profile views policies
DROP POLICY IF EXISTS "Users can create views" ON profile_views;
CREATE POLICY "Users can create views" ON profile_views
  FOR INSERT WITH CHECK (true);

-- Referrals policies
DROP POLICY IF EXISTS "Users can view their referrals" ON referrals;
CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (user_id = auth.uid());

-- Video consultations policies
DROP POLICY IF EXISTS "Users can manage their consultations" ON video_consultations;
CREATE POLICY "Users can manage their consultations" ON video_consultations
  FOR ALL USING (requester_id = auth.uid() OR contractor_id = auth.uid());

-- Message templates policies
DROP POLICY IF EXISTS "Users can manage their templates" ON message_templates;
CREATE POLICY "Users can manage their templates" ON message_templates
  FOR ALL USING (user_id = auth.uid());

-- Quotes policies
DROP POLICY IF EXISTS "Users can manage their quotes" ON quotes;
CREATE POLICY "Users can manage their quotes" ON quotes
  FOR ALL USING (contractor_id = auth.uid() OR client_id = auth.uid());

-- Badges policies
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view user badges" ON user_badges;
CREATE POLICY "Anyone can view user badges" ON user_badges
  FOR SELECT USING (true);
