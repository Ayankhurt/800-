const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanRedundantTables() {
    console.log('Cleaning redundant settings tables...');
    const redundant = ['users_setting', 'user_settings'];

    for (const table of redundant) {
        console.log(`Clearing rows from ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            console.log(`❌ Error cleaning ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table} cleared.`);
        }
    }
}

cleanRedundantTables();
