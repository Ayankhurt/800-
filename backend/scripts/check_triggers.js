import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTriggers() {
    console.log("Checking triggers on messages and conversations tables...");

    // We can't easily query pg_trigger via Supabase client unless we use rpc or raw sql
    // But we can try to guess if there's a trigger by looking at the schema definition if we have it
    // Or we can try to insert a message and see if conversations table gets updated automatically

    const convId = '96b49a6f-69bf-4dfe-93c7-ac87321336bb';

    const { data: convBefore } = await supabase.from("conversations").select("updated_at").eq("id", convId).single();
    console.log("Conversation updated_at before insert:", convBefore.updated_at);

    const messagePayload = {
        conversation_id: convId,
        sender_id: 'd31de931-11b0-494d-aadf-64b3fe841505',
        content: 'Trigger test message',
        is_read: false
    };

    const { data: msg, error } = await supabase.from("messages").insert(messagePayload).select().single();

    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log("Insert success. Message ID:", msg.id);
        const { data: convAfter } = await supabase.from("conversations").select("updated_at").eq("id", convId).single();
        console.log("Conversation updated_at after insert:", convAfter.updated_at);

        if (convBefore.updated_at !== convAfter.updated_at) {
            console.log("TRIGGER DETECTED: Conversations table was updated automatically!");
        } else {
            console.log("No automatic update detected.");
        }

        // Clean up
        await supabase.from("messages").delete().eq("id", msg.id);
    }
}

checkTriggers();
