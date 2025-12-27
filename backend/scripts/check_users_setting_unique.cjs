const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsersSettingConstraint() {
    console.log('Checking user_id uniqueness on users_setting...');
    const userId = '00000000-0000-4000-a000-000000000001';

    // First insert
    await supabase.from('users_setting').insert({ user_id: userId });

    // Second insert (should fail if unique)
    const { error } = await supabase.from('users_setting').insert({ user_id: userId });

    if (error) {
        console.log(`✅ Success: Second insert failed with: ${error.message}`);
    } else {
        console.log(`❌ Fail: Second insert succeeded. user_id is NOT unique on users_setting.`);
    }

    // Cleanup
    await supabase.from('users_setting').delete().eq('user_id', userId);
}

checkUsersSettingConstraint();
