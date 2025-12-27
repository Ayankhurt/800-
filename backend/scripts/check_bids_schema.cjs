const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBids() {
    console.log('--- BIDS SCHEMA ---');
    const { data: bids, error: bidsError } = await supabase.from('bids').select('*').limit(1);
    if (bidsError) console.error('Bids Error:', bidsError);
    else console.log('Bids Columns:', bids.length > 0 ? Object.keys(bids[0]) : 'Table empty');

    console.log('--- BID_SUBMISSIONS SCHEMA ---');
    const { data: subs, error: subsError } = await supabase.from('bid_submissions').select('*').limit(1);
    if (subsError) console.error('Subs Error:', subsError);
    else console.log('Subs Columns:', subs.length > 0 ? Object.keys(subs[0]) : 'Table empty');
}

checkBids();
