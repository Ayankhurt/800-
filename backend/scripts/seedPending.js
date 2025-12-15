
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (!users || users.length === 0) return console.log("No users.");
    const userId = users[0].id;

    const items = [
        { contractor_id: userId, verification_type: 'identity', verification_status: 'pending', document_url: 'https://placehold.co/400' },
        { contractor_id: userId, verification_type: 'license', verification_status: 'pending', document_url: 'https://placehold.co/400' },
        { contractor_id: userId, verification_type: 'insurance', verification_status: 'pending', document_url: 'https://placehold.co/400' },
        { contractor_id: userId, verification_type: 'background_check', verification_status: 'pending', document_url: 'https://placehold.co/400' },
    ];

    const { error } = await supabase.from('contractor_verifications').insert(items);
    if (error) console.error(error);
    else console.log("Seeded pending items.");
}
seed();
