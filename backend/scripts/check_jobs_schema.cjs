const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('🔍 Checking Jobs Schema...');
    const { data: cols, error: colError } = await supabase.from('jobs').select('*').limit(1);

    if (colError) {
        console.log('⚠️ Error fetching rows:', colError.message);
    } else {
        console.log('✅ Columns found:', cols.length > 0 ? Object.keys(cols[0]) : 'Table exists but empty');
    }
}

checkSchema();
