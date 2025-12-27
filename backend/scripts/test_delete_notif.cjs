
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDelete() {
    // 1. Get a notification ID
    const { data, error } = await supabase.from('notifications').select('id, user_id').limit(1).single();
    if (error) {
        console.error('Error fetching notification:', error);
        return;
    }
    console.log('Got notification ID:', data.id, 'for user:', data.user_id);

    // 2. Try to delete it (using service role, so it should work regardless of RLS)
    const { error: deleteError } = await supabase.from('notifications').delete().eq('id', data.id);
    if (deleteError) {
        console.error('Delete error:', deleteError);
    } else {
        console.log('Successfully deleted notification:', data.id);

        // 3. Verify it's gone
        const { data: verifyData } = await supabase.from('notifications').select('id').eq('id', data.id).single();
        if (verifyData) {
            console.error('FAILED: Notification still exists!');
        } else {
            console.log('Verified: Notification is gone.');
        }
    }
}

testDelete();
