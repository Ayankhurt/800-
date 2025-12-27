const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectUsers() {
    console.log('Inspecting users table...');
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
        console.error('Error fetching users:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in users table:', Object.keys(data[0]));
        console.log('Sample user structure:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No users found in table.');
    }
}

inspectUsers();
