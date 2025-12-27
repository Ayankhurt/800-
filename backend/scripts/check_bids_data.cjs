const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBidsColumns() {
    const { data: bids, error } = await supabase.from('bids').select('job_id, jobs_id').limit(10);
    if (error) {
        console.error(error);
        return;
    }
    process.stdout.write(JSON.stringify(bids, null, 2));
}

checkBidsColumns();
