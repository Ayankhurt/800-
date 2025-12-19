
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { t_name: 'bids' });
    if (error) {
        // Fallback: try raw query via another RPC if exists, or just select 1 row
        console.log('RPC failed, trying select *');
        const { data: sample, error: e2 } = await supabase.from('bids').select('*').limit(1);
        if (sample && sample.length > 0) {
            console.log('Bids columns:', Object.keys(sample[0]));
        } else {
            console.log('No data in bids table to check columns.');
        }
    } else {
        console.log('Bids columns (RPC):', data);
    }
}

checkColumns();
