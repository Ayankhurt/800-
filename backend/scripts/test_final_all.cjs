
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testFinal() {
    const userId = 'b53ee8d8-eed0-4290-837a-8107b82544fc'; // PM ID from S1
    console.log('Testing final getAllBids sub-queries...');

    console.log('\n--- Bids Query ---');
    const { data: b, error: eb } = await supabase
        .from('bids')
        .select(`
                *,
                project_manager:users!bids_project_manager_id_fkey (id, email, first_name, last_name, avatar_url),
                project:projects(id, title),
                submissions:bid_submissions!bid_submissions_bid_id_fkey (id)
            `)
        .limit(1);
    if (eb) console.error('EB:', eb);
    else console.log('SB:', b);

    console.log('\n--- Job Apps Query ---');
    const { data: ja, error: eja } = await supabase
        .from('job_applications')
        .select(`
                    *,
                    job:jobs!job_applications_job_id_fkey (id, title, location, status, projects_manager_id)
                `)
        .eq('contractor_id', userId)
        .limit(1);
    if (eja) console.error('EJA:', eja);
    else console.log('SJA:', ja);
}

testFinal();
