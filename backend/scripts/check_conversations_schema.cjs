const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log('🔍 Checking Conversations Schema...');
    const { data: cols, error: colError } = await supabase.from('conversations').select('*').limit(1);

    if (colError) {
        console.log('⚠️ Error fetching rows:', colError.message);
    } else {
        console.log('✅ Columns found:', cols.length > 0 ? Object.keys(cols[0]) : 'Table exists but empty. (Cannot infer columns)');
    }

    console.log('🔍 Checking Messages Schema...');
    const { data: mCols, error: mColError } = await supabase.from('messages').select('*').limit(1);

    if (mColError) {
        console.log('⚠️ Error fetching rows:', mColError.message);
    } else {
        console.log('✅ Messages Columns found:', mCols.length > 0 ? Object.keys(mCols[0]) : 'Table exists but empty.');
    }
}

checkSchema();
