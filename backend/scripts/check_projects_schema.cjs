const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProjectsSchema() {
    const { data, error } = await supabase.from('projects').select('*').limit(1);
    if (error) {
        console.error('Error fetching projects:', error);
    } else {
        console.log('Sample project data:', JSON.stringify(data[0], null, 2));
    }

    // Check if there are any specific constraints or missing fields
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { t_name: 'projects' });
    if (colError) {
        console.log("Could not fetch columns via RPC. Trying information_schema...");
        // This might fail due to RLS/Permissions, but we use Service Role
        const { data: info, error: infoError } = await supabase.from('projects').select('*').limit(0);
        console.log("Projects Columns (keys):", Object.keys(data[0] || {}));
    } else {
        console.log('Projects columns info:', JSON.stringify(cols, null, 2));
    }
}

checkProjectsSchema();
