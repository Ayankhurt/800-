
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testApps() {
    console.log('Testing job applications query...');
    try {
        const { data, error } = await supabase
            .from('job_applications')
            .select(`
                    *,
                    job:jobs (id, title, location, status, projects_manager_id)
                `)
            .limit(1);

        if (error) console.error('Apps Error:', error);
        else console.log('Apps Success:', data);
    } catch (e) {
        console.error('Apps Crash:', e);
    }
}

testApps();
