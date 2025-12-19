
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log('Testing final query...');
    try {
        const { data, error } = await supabase
            .from('bids')
            .select(`
                *,
                project_manager:users!bids_project_manager_id_fkey (id, email, first_name, last_name, avatar_url),
                project:projects(id, title),
                submissions:bid_submissions!bid_submissions_bid_id_fkey (id)
            `, { count: 'exact' })
            .limit(1);

        if (error) console.error('Final Error:', error);
        else console.log('Final Success:', data);
    } catch (e) {
        console.error('Final Crash:', e);
    }
}

test();
