const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalTableCheck() {
    console.log('--- DEFINITIVE TABLE CHECK ---');
    const tables = ['user_settings', 'users_setting', 'users_settings'];

    for (const table of tables) {
        const { error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`Table: ${table} | Status: ❌ Missing | Error: ${error.message}`);
        } else {
            console.log(`Table: ${table} | Status: ✅ Exists  | Rows: ${count}`);
        }
    }
}

finalTableCheck();
