const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAllTables() {
    console.log('Listing all tables reachable via public schema...');

    // We can't list tables directly via Supabase client easily without RPC.
    // But we can try common ones.
    const tables = ['users', 'user_settings', 'profiles', 'contractor_profiles', 'jobs', 'projects'];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table '${table}' check:`, error.message);
        } else {
            console.log(`✅ Table '${table}' exists.`);
        }
    }
}

listAllTables();
