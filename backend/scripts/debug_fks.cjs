
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log('Testing query for project_manager...');
    const { data: q1, error: e1 } = await supabase.from('bids').select('*, users!bids_project_manager_id_fkey(id)').limit(1);
    if (e1) console.error('E1:', e1);
    else console.log('S1:', q1);

    console.log('\nTesting query for projects...');
    const { data: q2, error: e2 } = await supabase.from('bids').select('*, projects(id)').limit(1);
    if (e2) console.error('E2:', e2);
    else console.log('S2:', q2);
}

test();
