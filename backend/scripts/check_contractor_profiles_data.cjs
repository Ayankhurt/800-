const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkContractorProfiles() {
    const { data, error } = await supabase.from('contractor_profiles').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    console.log('--- CONTRACTOR PROFILE SAMPLE ---');
    console.log(JSON.stringify(data[0] || {}, null, 2));
}

checkContractorProfiles();
