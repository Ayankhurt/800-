import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
    console.log('🔍 Checking Constraints for disputes table...');

    // This query fetches foreign keys
    const { data, error } = await supabase
        .rpc('get_foreign_keys_for_table', { table_name: 'disputes' });

    // Since we probably don't have that RPC, let's try to infer from error message by trying different joins

    console.log('Trying standard join...');
    const { error: err1 } = await supabase
        .from('disputes')
        .select('*, projects(*)')
        .limit(1);

    if (err1) console.log('Standard Join Error:', err1.message);
    else console.log('Standard Join: ✅ Success');

    console.log('Trying foreign key name join (disputes_project_id_fkey)...');
    const { error: err2 } = await supabase
        .from('disputes')
        .select('*, projects!disputes_project_id_fkey(*)')
        .limit(1);

    if (err2) console.log('FK Name Join Error:', err2.message);
    else console.log('FK Name Join: ✅ Success');

}

checkConstraints();
