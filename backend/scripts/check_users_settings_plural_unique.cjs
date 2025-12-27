const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsersSettingsUnique() {
    console.log('Checking user_id uniqueness on users_settings...');
    const userId = '00000000-0000-4000-a000-000000000002';

    await supabase.from('users_settings').insert({ user_id: userId });
    const { error } = await supabase.from('users_settings').insert({ user_id: userId });

    if (error) {
        console.log(`✅ Success: Second insert failed with: ${error.message}`);
    } else {
        console.log(`❌ Fail: Second insert succeeded. user_id is NOT unique on users_settings.`);
    }

    await supabase.from('users_settings').delete().eq('user_id', userId);
}

checkUsersSettingsUnique();
