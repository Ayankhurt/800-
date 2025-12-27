const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectData() {
    const { data } = await supabase.from('users_setting').select('*');
    console.log('Data in users_setting:', JSON.stringify(data, null, 2));
}

inspectData();
