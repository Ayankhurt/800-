const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function countData() {
    for (const table of ['users_setting', 'users_settings']) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`Table '${table}' count: ${count}, Error: ${error ? error.message : 'None'}`);
    }
}

countData();
