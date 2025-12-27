import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAppConstraints() {
    console.log('🔍 Checking Constraints for job_applications table...');

    console.log('Trying standard join for jobs...');
    const { error: err1 } = await supabase
        .from('job_applications')
        .select('*, jobs(*)')
        .limit(1);

    if (err1) console.log('Standard Join Error:', err1.message);
    else console.log('Standard Join: ✅ Success');

    console.log('Trying foreign key name join (job_applications_job_id_fkey)...');
    const { error: err2 } = await supabase
        .from('job_applications')
        .select('*, jobs!job_applications_job_id_fkey(*)')
        .limit(1);

    if (err2) console.log('FK Name Join Error:', err2.message);
    else console.log('FK Name Join: ✅ Success');

}

checkAppConstraints();
