const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probeCorrectTable() {
    console.log('Probing users_settings vs users_setting...');

    const tables = ['users_setting', 'users_settings'];
    const columns = ['id', 'user_id', 'email_notifications', 'push_notifications', 'dark_mode'];

    for (const table of tables) {
        console.log(`\n--- Probing table: ${table} ---`);
        for (const col of columns) {
            const { error } = await supabase.from(table).select(col).limit(1);
            if (error) {
                console.log(`❌ Column '${col}': ${error.message}`);
            } else {
                console.log(`✅ Column '${col}' exists.`);
            }
        }
    }
}

probeCorrectTable();
