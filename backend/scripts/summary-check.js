import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllTables() {
    const tables = [
        'users',
        'audit_logs',
        'notifications',
        'projects',
        'jobs',
        'bids',
        'transactions',
        'payouts',
        'contractor_profiles',
        'disputes'
    ];

    console.log('--- Table Summary ---');
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
            console.log(`✅ ${table}: ${count} rows`);
        }
    }
}

checkAllTables();
