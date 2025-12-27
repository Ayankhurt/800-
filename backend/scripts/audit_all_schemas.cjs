const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getAllSchemas() {
    const tables = [
        'users', 'jobs', 'projects', 'appointments', 'bids',
        'conversations', 'messages', 'job_applications',
        'contractor_profiles', 'portfolio_items', 'reviews',
        'notifications', 'payments'
    ];

    console.log('--- DATABASE SCHEMA AUDIT ---');

    for (const table of tables) {
        console.log(`\n[Table: ${table}]`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.log(`❌ Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log(`✅ Columns: ${Object.keys(data[0]).join(', ')}`);
        } else {
            console.log(`✅ Table exists but is empty. Column info unavailable via select * limit 1.`);
            // Try to get columns via a different method if possible, but select * is often enough for existing data
        }
    }
}

getAllSchemas();
