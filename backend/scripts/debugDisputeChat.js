import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugChat() {
    // 1. Get a dispute ID
    const { data: disputes } = await supabase.from('disputes').select('id, project_id').limit(1);

    if (!disputes || disputes.length === 0) {
        console.log("No disputes found.");
        return;
    }

    const disputeId = disputes[0].id; // Use real ID
    console.log(`Debugging Dispute ID: ${disputeId}`);

    // 2. Run the Controller Query
    const { data, error } = await supabase
        .from("disputes")
        .select(`
            *,
            project:projects (
                *,
                conversations (
                    *,
                    messages (
                        *,
                        sender:users (first_name, last_name, email)
                    )
                )
            ),
            raised_by_user:users!disputes_raised_by_fkey (id, first_name, last_name, email, avatar_url),
            responses:dispute_responses (*)
        `)
        .eq("id", disputeId)
        .single();

    if (error) {
        console.error("Query Error:", error);
    } else {
        console.log("Dispute Project Title:", data.project?.title);
        console.log("Conversations Count:", data.project?.conversations?.length);
        if (data.project?.conversations?.length > 0) {
            console.log("Messages in first conversation:", data.project.conversations[0].messages?.length);
            console.log("First Message:", data.project.conversations[0].messages?.[0]);
        } else {
            console.log("Conversations is empty or null:", data.project?.conversations);
        }
    }
}

debugChat();
