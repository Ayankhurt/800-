
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSQL() {
    const query = process.argv[2] || 'SELECT 1';
    console.log('Executing SQL:', query);
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: query });
    if (error) {
        console.error('SQL Execution failed via RPC:', error);
    } else {
        console.log('SQL Execution success:', data);
    }
}

runSQL();
