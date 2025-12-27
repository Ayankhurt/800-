const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking Appointments Schema...');

    // 1. Check columns
    const { data: cols, error: colError } = await supabase
        .from('appointments')
        .select('*')
        .limit(1);

    if (colError) {
        // If table empty, error might be just 'no rows' which is fine, 
        // but if table missing, it's a problem.
        console.log('⚠️ Error fetching rows (might be empty):', colError.message);
    } else {
        console.log('✅ Columns found:', cols.length > 0 ? Object.keys(cols[0]) : 'Table exists but empty');
    }

    // 2. Test Insertion
    console.log('\n📝 Testing Appointment Insertion...');

    // Need a valid user ID first
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) {
        console.error('❌ No users found to test with');
        return;
    }
    const userId = users[0].id;
    console.log('👤 Using User ID:', userId);

    const testAppt = {
        created_by: userId,
        title: 'Schema Test Appointment',
        start_time: new Date().toISOString(),
        status: 'scheduled'
    };

    const { data: inserted, error: insertError } = await supabase
        .from('appointments')
        .insert(testAppt)
        .select()
        .single();

    if (insertError) {
        console.error('❌ Insertion Failed:', insertError);
    } else {
        console.log('✅ Insertion Successful!', inserted.id);
        // Cleanup
        await supabase.from('appointments').delete().eq('id', inserted.id);
    }
}

checkSchema();
