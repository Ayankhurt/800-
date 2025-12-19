
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    console.log('Testing query 1...');
    try {
        const { data, error } = await supabase
            .from('bids')
            .select(`
                *,
                project_manager:project_manager_id (id, email, first_name, last_name, avatar_url),
                project:projects(id, title),
                submissions:bid_submissions(id)
            `, { count: 'exact' })
            .limit(1);

        if (error) console.error('Query 1 Error:', error);
        else console.log('Query 1 Success:', data);
    } catch (e) {
        console.error('Query 1 Crash:', e);
    }

    console.log('\nTesting query 2 (with explicit FK)...');
    try {
        const { data, error } = await supabase
            .from('bids')
            .select(`
                *,
                project_manager:users!bids_project_manager_id_fkey(id, email, first_name, last_name, avatar_url),
                project:projects!bids_project_id_fkey(id, title),
                submissions:bid_submissions!bid_submissions_bid_id_fkey(id)
            `, { count: 'exact' })
            .limit(1);

        if (error) console.error('Query 2 Error:', error);
        else console.log('Query 2 Success:', data);
    } catch (e) {
        console.error('Query 2 Crash:', e);
    }
}

test();
