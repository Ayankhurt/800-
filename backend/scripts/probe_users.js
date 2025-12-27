import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserCols() {
    console.log("Checking columns for users table...");
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else if (data && data.length > 0) {
        console.log("User columns:", Object.keys(data[0]));
    } else {
        console.log("No users found.");
    }
}

checkUserCols();
