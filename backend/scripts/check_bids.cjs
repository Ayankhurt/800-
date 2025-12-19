
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Bids Table ---');
    const { data: bids, error: e1 } = await supabase.from('bids').select('*').limit(5);
    console.log('Bids sample:', bids);
    if (e1) console.error('Bids error:', e1);

    console.log('\n--- Job Applications Table ---');
    const { data: apps, error: e2 } = await supabase.from('job_applications').select('*').limit(5);
    console.log('Apps sample:', apps);
    if (e2) console.error('Apps error:', e2);

    console.log('\n--- Bid Submissions Table ---');
    const { data: sub, error: e3 } = await supabase.from('bid_submissions').select('*').limit(5);
    console.log('Submissions sample:', sub);
    if (e3) console.error('Submissions error:', e3);
}

check();
