import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addPayoutColumns() {
    console.log('🔧 Adding missing columns to payouts table...');

    try {
        // Note: Supabase client doesn't support ALTER TABLE directly
        // We need to use the SQL editor in Supabase dashboard or use raw SQL

        console.log('\n⚠️  Please run the following SQL in your Supabase SQL Editor:\n');
        console.log('-- Add missing columns to payouts table');
        console.log('ALTER TABLE payouts ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;');
        console.log('ALTER TABLE payouts ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;');
        console.log('ALTER TABLE payouts ADD COLUMN IF NOT EXISTS bank_account JSONB;');
        console.log('ALTER TABLE payouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();');
        console.log('\n-- Update existing completed payouts with processed_at');
        console.log("UPDATE payouts SET processed_at = created_at WHERE status = 'completed' AND processed_at IS NULL;");
        console.log('\n✅ After running the SQL above, the payout management will be fully functional!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addPayoutColumns();
