
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStats() {
    const { data, error } = await supabase
        .from('contractor_verifications')
        .select('*');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Total Records:", data.length);
    const pending = data.filter(i => i.verification_status === 'pending');
    console.log("Pending Count:", pending.length);

    const types = ['identity', 'license', 'insurance', 'background_check'];
    types.forEach(t => {
        const count = pending.filter(i => i.verification_type === t).length;
        console.log(`Pending ${t}:`, count);
    });
}

checkStats();
