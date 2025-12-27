
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function renameColumn() {
    // Try to rename using raw SQL if the user has a tool for it, 
    // but here we just try to update a record using 'is_read' to see if it work now.
    // If it fails with "column does not exist", then we know for sure.
    const { error } = await supabase.from('notifications').select('is_read').limit(1);
    if (error && error.message.includes('column "is_read" does not exist')) {
        console.log('Column is_read DOES NOT exist. Current column is is_reads.');
        // We can't easily run ALTER TABLE without a specific RPC or direct postgres access.
        // So we will update the code to match the DB.
    } else if (!error) {
        console.log('Column is_read exists!');
    } else {
        console.error('Other error:', error);
    }
}

renameColumn();
