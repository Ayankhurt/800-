const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectUserSettings() {
    console.log('🔍 Inspecting user_settings table...');

    // Check if we can select even with non-existent columns via * (Supabase usually handles this)
    // But let's check what Columns actually exist.
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching from user_settings:', error.message);
    } else {
        console.log('✅ select * succeeded.');
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('No data in user_settings to inspect columns.');
            // Try to get column info from information_schema if possible
            const { data: cols, error: colError } = await supabase.rpc('execute_sql', {
                sql_query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_settings';"
            });
            if (colError) {
                console.log('Could not use execute_sql to find columns.');
            } else {
                console.log('Columns from information_schema:', cols);
            }
        }
    }
}

inspectUserSettings();
