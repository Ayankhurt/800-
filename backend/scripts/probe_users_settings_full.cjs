const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probeUsersSettingsAllFields() {
    console.log('Probing all expected fields on users_settings...');
    const columns = [
        'id', 'user_id', 'email_notifications', 'push_notifications',
        'sms_notifications', 'marketing_emails', 'language', 'timezone',
        'privacy_profile_visible', 'privacy_show_email', 'privacy_show_phone',
        'dark_mode'
    ];

    for (const col of columns) {
        const { error } = await supabase.from('users_settings').select(col).limit(1);
        if (error) {
            console.log(`❌ Column '${col}': ${error.message}`);
        } else {
            console.log(`✅ Column '${col}' exists.`);
        }
    }
}

probeUsersSettingsAllFields();
