import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkParticipation() {
    const convId = '96b49a6f-69bf-4dfe-93c7-ac87321336bb';

    console.log(`Checking participants for conversation ${convId}...`);

    const { data: participants, error } = await supabase
        .from('conversation_participants')
        .select('user_id, users(email, first_name, last_name)')
        .eq('conversation_id', convId);

    if (error) {
        console.error("Error fetching participants:", error);
    } else {
        console.log("Participants:", JSON.stringify(participants, null, 2));
    }
}

checkParticipation();
