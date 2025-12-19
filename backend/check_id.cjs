
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    console.log("SUPABASE_URL:", supabaseUrl);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkId() {
    const id = '10df058c-db55-428b-a69e-337eed30b2e3';

    console.log(`Checking ID: ${id}`);

    // Check Jobs
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

    if (job) {
        console.log("✅ Found in JOBS table");
        console.log("Job Object Keys:", Object.keys(job));
        console.log("Project Manager ID:", job.project_manager_id);
        console.log("Full Job:", JSON.stringify(job, null, 2));

        // Check if Project Manager exists in Users
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, first_name')
            .eq('id', job.project_manager_id)
            .single();

        if (user) {
            console.log("✅ Project Manager found in USERS table");
        } else {
            console.log("❌ Project Manager NOT found in USERS table");
            console.log("User Error:", userError);
        }

    } else {
        console.log("❌ Not found in JOBS table");
        console.log("Job Error:", jobError);
    }
}

checkId();
