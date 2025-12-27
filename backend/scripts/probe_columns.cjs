const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probeColumns() {
    console.log('Probing columns in user_settings...');
    const columns = ['user_id', 'email_notifications', 'push_notifications', 'dark_mode'];

    for (const col of columns) {
        const { error } = await supabase.from('user_settings').select(col).limit(1);
        if (error) {
            console.log(`❌ Column '${col}' check:`, error.message);
        } else {
            console.log(`✅ Column '${col}' exists.`);
        }
    }
}

probeColumns();
