const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addDarkModeColumn() {
    console.log('🔧 Adding dark_mode column to user_settings table...');

    // Using the existing execute_sql RPC if available
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: 'ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT FALSE;'
    });

    if (error) {
        console.error('❌ SQL Execution failed:', error.message);
        console.log('Searching for alternative way...');

        // Sometimes the RPC name is different or doesn't exist.
        // If this fails, we might need another way, but based on run_sql.cjs, it should work.
    } else {
        console.log('✅ SQL Execution success:', data);
    }
}

addDarkModeColumn();
