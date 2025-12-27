const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probeNotifs() {
    console.log('Probing notifications table...');
    const columns = ['id', 'user_id', 'title', 'content', 'type', 'is_read', 'is_reads'];

    for (const col of columns) {
        const { error } = await supabase.from('notifications').select(col).limit(1);
        if (error) {
            console.log(`❌ Column '${col}': ${error.message}`);
        } else {
            console.log(`✅ Column '${col}' exists.`);
        }
    }
}

probeNotifs();
