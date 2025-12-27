const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    console.log('Inspecting columns for plural table names...');

    // Fallback to information_schema since we have no data
    const query = (table) => `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}';`;

    for (const table of ['users_setting', 'users_settings']) {
        console.log(`\nTable: ${table}`);
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: query(table) });
        if (error) {
            console.log(`❌ RPC failed for ${table}: ${error.message}`);
            // Try to insert a dummy to see if it works
            const { error: insError } = await supabase.from(table).insert({ id: '00000000-0000-4000-a000-000000000000' }).select();
            if (insError) console.log(`   Dummy insert error: ${insError.message}`);
        } else {
            console.log(`✅ Columns: ${data.map(c => c.column_name).join(', ')}`);
        }
    }
}

checkColumns();
