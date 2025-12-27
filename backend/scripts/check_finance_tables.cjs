const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFinanceTables() {
    const tables = ['payments', 'transactions', 'escrow_transactions', 'payouts'];
    for (const table of tables) {
        console.log(`--- Checking Table: ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) console.error(`Error for ${table}:`, error.message);
        else console.log(`Table ${table} exists. Columns:`, data.length > 0 ? Object.keys(data[0]) : 'Empty');
    }
}

checkFinanceTables();
