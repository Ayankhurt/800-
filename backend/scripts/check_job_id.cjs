const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJob() {
    const jobId = "f2a970a1-83b6-4e4a-bb29-c8b193af2dae";
    console.log(`Checking if ID ${jobId} exists in 'jobs' table...`);
    const { data: job, error: jobError } = await supabase.from('jobs').select('id, title').eq('id', jobId).single();

    if (job) {
        console.log('✅ Found in JOBS table:', job);
        return;
    }

    console.log('❌ Not found in JOBS table. Checking PROJECTS table...');
    const { data: project, error: projError } = await supabase.from('projects').select('id, title').eq('id', jobId).single();

    if (project) {
        console.log('✅ Found in PROJECTS table:', project);
    } else {
        console.log('❌ Not found in PROJECTS either.');
    }
}

checkJob();
