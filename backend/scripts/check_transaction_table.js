import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const check = async () => {
    console.log('Checking transactions table...');

    // 1. Try to select from transactions
    const { data, error } = await supabase.from('transactions').select('*').limit(1);

    if (error) {
        console.error('❌ Error accessing transactions table:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('💡 The table likely does not exist. Please run migrations/fix_transactions_table.sql');
        } else if (error.message.includes('relationship')) {
            console.log('💡 The table exists but there is a relationship issue:', error.message);
        }
    } else {
        console.log('✅ transactions table exists and is accessible.');
        console.log('Sample data:', data);
    }

    // 2. Try to insert a dummy (rollback or similar? no transaction support in http)
    // We won't insert to avoid garbage.
};

check();
