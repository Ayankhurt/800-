
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("Checking 'bids' table schema...");
    const { data, error } = await supabase.from('bids').select('*').limit(1);

    if (error) {
        console.error("Error fetching from bids:", error);
    } else if (data && data.length > 0) {
        console.log("Columns in 'bids':", Object.keys(data[0]));
    } else {
        console.log("Bids table is empty, cannot detect columns from data.");
        // Try to insert a dummy row or something? No, let's try to fetch a row from another table.
    }

    console.log("\nChecking 'bid_submissions' table schema...");
    const { data: subData, error: subError } = await supabase.from('bid_submissions').select('*').limit(1);

    if (subError) {
        console.error("Error fetching from bid_submissions:", subError);
    } else if (subData && subData.length > 0) {
        console.log("Columns in 'bid_submissions':", Object.keys(subData[0]));
    } else {
        console.log("bid_submissions table is empty.");
    }
}

checkSchema();
