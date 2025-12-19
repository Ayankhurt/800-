
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkId() {
    const id = '5611b845-12dd-4061-b9b3-f6aac9d5ad54';

    console.log(`Checking ID: ${id}`);

    // Check Jobs
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

    if (job) {
        console.log("✅ Found in JOBS table");
        console.log(job);
    } else {
        console.log("❌ Not found in JOBS table");
    }

    // Check Bids
    const { data: bid, error: bidError } = await supabase
        .from('bids')
        .select('*')
        .eq('id', id)
        .single();

    if (bid) {
        console.log("✅ Found in BIDS table");
        console.log(bid);
    } else {
        console.log("❌ Not found in BIDS table");
    }

    // Check Job Applications
    const { data: app, error: appError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', id)
        .single();

    if (app) {
        console.log("✅ Found in JOB_APPLICATIONS table");
        console.log(app);
    } else {
        console.log("❌ Not found in JOB_APPLICATIONS table");
    }

}

checkId();
