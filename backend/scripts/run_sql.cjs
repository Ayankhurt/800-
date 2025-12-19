
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSQL() {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: 'ALTER TABLE bids ADD COLUMN IF NOT EXISTS amount NUMERIC;' });
    if (error) {
        console.error('SQL Execution failed via RPC:', error);
    } else {
        console.log('SQL Execution success:', data);
    }
}

runSQL();
