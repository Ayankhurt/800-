
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: b, error: eb } = await supabase.from('bids').select('*').limit(1);
    console.log('Bids columns:', b && b.length > 0 ? Object.keys(b[0]) : 'no data');

    const { data: p, error: ep } = await supabase.from('projects').select('*').limit(1);
    console.log('Projects columns:', p && p.length > 0 ? Object.keys(p[0]) : 'no data');

    const { data: j, error: ej } = await supabase.from('jobs').select('*').limit(1);
    console.log('Jobs columns:', j && j.length > 0 ? Object.keys(j[0]) : 'no data');
}

check();
