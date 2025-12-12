-- Escrow Transactions Table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES project_milestones(id),
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'held', -- held, released, failed, refunded
  stripe_payment_intent_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  deposited_by UUID NOT NULL REFERENCES users(id),
  deposited_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_project ON escrow_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_escrow_milestone ON escrow_transactions(milestone_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);

-- Add Stripe fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_stripe_account ON users(stripe_account_id);
