
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: verifications } = await supabase.from('contractor_verifications').select('id, contractor_id');
    console.log('Verifications:', verifications);

    if (verifications && verifications.length > 0) {
        const idToCheck = verifications[0].contractor_id;
        console.log('Checking User ID:', idToCheck);
        const { data: user, error } = await supabase.from('users').select('*').eq('id', idToCheck).single();
        console.log('User found:', user);
        console.log('Error:', error);
    }
}

check();
