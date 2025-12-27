const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTableNames() {
    console.log('Checking exact table names from image...');
    const candidates = ['user_settings', 'users_setting', 'users_settings'];

    for (const table of candidates) {
        // Use a simple select to verify existence
        const { error, data } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table '${table}': ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' exists. Rows found: ${data.length}`);
            if (data.length > 0) {
                console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }
}

checkTableNames();
