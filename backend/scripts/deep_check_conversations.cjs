const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepCheckConversations() {
    console.log('--- DEEP CHECK: conversations ---');
    const { data, error } = await supabase.from('conversations').select('*').limit(5);
    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        // Collect all unique keys from all 5 rows
        const allKeys = new Set();
        data.forEach(row => Object.keys(row).forEach(key => allKeys.add(key)));
        console.log('All Columns found:', Array.from(allKeys));
        console.log('Sample Row:', data[0]);
    } else {
        console.log('Table is empty.');
        // Check if we can get column info from information_schema
        const { data: schema, error: schemaError } = await supabase.rpc('get_table_columns', { table_name: 'conversations' });
        if (schemaError) {
            console.log('RPC get_table_columns failed, trying custom query if possible...');
        } else {
            console.log('Columns from RPC:', schema);
        }
    }
}

deepCheckConversations();
