const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/HP/Desktop/800$/800-/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("--- Checking messages table schema ---");

    // We can't easily get table structure via JS client directly without listing data or using a specialized RPC.
    // However, we can try to insert a dummy row and see the error, or select * limit 1 and checking keys.

    // Attempt 1: Select one row
    const { data: rows, error } = await supabase.from('messages').select('*').limit(1);

    if (error) {
        console.error("Error selecting from messages:", error);
    } else if (rows.length > 0) {
        console.log("Columns found in existing row:", Object.keys(rows[0]));
        if ('attachment_url' in rows[0]) {
            console.log("SUCCESS: attachment_url column exists.");
        } else {
            console.log("FAILURE: attachment_url column is MISSING.");
        }
    } else {
        console.log("No rows in messages table. Can't infer columns from data.");
        // If no rows, we can't be 100% sure via select, but the error PGRST204 confirmed it's missing or hidden.
    }
}

checkSchema();
