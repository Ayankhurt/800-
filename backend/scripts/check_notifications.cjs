
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkNotifications() {
    const { data, error } = await supabase.from('notifications').select('*').limit(1);
    if (error) {
        console.error('Error fetching notification:', error);
    } else if (data && data.length > 0) {
        console.log('Notification columns:', Object.keys(data[0]));
        console.log('Sample notification:', data[0]);
    } else {
        console.log('No notifications found.');
    }
}

checkNotifications();
