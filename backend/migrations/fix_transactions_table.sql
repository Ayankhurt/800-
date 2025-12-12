-- RENAME this file to enable execution or run manually in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Create table if not exists (minimal)
    CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. Add columns if they don't exist
    -- project_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'project_id') THEN
        ALTER TABLE transactions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;

    -- milestone_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'milestone_id') THEN
        ALTER TABLE transactions ADD COLUMN milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL;
    END IF;

    -- payer_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payer_id') THEN
        ALTER TABLE transactions ADD COLUMN payer_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- payee_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payee_id') THEN
        ALTER TABLE transactions ADD COLUMN payee_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    -- amount
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount') THEN
        ALTER TABLE transactions ADD COLUMN amount DECIMAL(12, 2) NOT NULL DEFAULT 0;
    END IF;

    -- type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'type') THEN
        ALTER TABLE transactions ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'payment';
    END IF;

    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'status') THEN
        ALTER TABLE transactions ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- meta
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'meta') THEN
        ALTER TABLE transactions ADD COLUMN meta JSONB;
    END IF;

    -- 3. Add Indexes (IF NOT EXISTS is supported natively in PG)
    
END $$;

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

-- 6. Trigger
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
