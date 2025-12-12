-- Enhanced Reviews Table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS category_ratings JSONB;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_urls TEXT[];
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS contractor_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Enhanced Messages Table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Typing Indicators Table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_updated ON typing_indicators(updated_at);

-- Enhanced Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_permissions JSONB;

-- Enhanced Reports Table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS moderator_action VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS moderator_notes TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Enhanced Contractor Verifications Table
ALTER TABLE contractor_verifications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE contractor_verifications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Project Milestones Payment Status
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE project_milestones ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_reviews_hidden ON reviews(is_hidden);
