-- ============================================
-- FIX DB SCHEMA - TRANSACTIONS TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create transactions table if not exists with correct columns
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  payer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  type VARCHAR(50) NOT NULL DEFAULT 'payment', -- 'payment', 'refund', 'payout', 'fee'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50),
  payment_processor VARCHAR(50),
  processor_payment_id VARCHAR(255),
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  processor_fee DECIMAL(12, 2) DEFAULT 0,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns safely (if table already existed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'project_id') THEN
        ALTER TABLE transactions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'milestone_id') THEN
        ALTER TABLE transactions ADD COLUMN milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payer_id') THEN
        ALTER TABLE transactions ADD COLUMN payer_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payee_id') THEN
        ALTER TABLE transactions ADD COLUMN payee_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_processor') THEN
        ALTER TABLE transactions ADD COLUMN payment_processor VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'processor_payment_id') THEN
        ALTER TABLE transactions ADD COLUMN processor_payment_id VARCHAR(255);
    END IF;
END $$;

-- 3. Add Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_payer ON transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 4. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
  FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin')
    )
  );

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transaction_modtime ON transactions;
CREATE TRIGGER update_transaction_modtime
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
