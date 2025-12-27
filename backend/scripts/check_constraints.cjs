const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConstraints() {
    console.log('Checking constraints on user_settings...');

    // We can't use complex SQL without RPC, so let's just try to INSERT two records for same user
    const userId = '00000000-0000-4000-a000-000000000000'; // Dummy UUID

    console.log('Attempting first insert...');
    const { error: err1 } = await supabase.from('user_settings').insert({ user_id: userId });
    if (err1) {
        console.log('First insert failed:', err1.message);
        // If it failed because of duplicate, it means dummy already exists or constraint is active
    } else {
        console.log('First insert success.');
    }

    console.log('Attempting second insert for same user...');
    const { error: err2 } = await supabase.from('user_settings').insert({ user_id: userId });
    if (err2) {
        console.log('Second insert failed (Expected if UNIQUE):', err2.message);
    } else {
        console.log('Second insert success (NOT GOOD - user_id NOT UNIQUE)');
    }

    // Cleanup
    await supabase.from('user_settings').delete().eq('user_id', userId);
}

checkConstraints();
