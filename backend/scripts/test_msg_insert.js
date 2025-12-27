import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    const convId = '96b49a6f-69bf-4dfe-93c7-ac87321336bb';
    const senderId = 'd31de931-11b0-494d-aadf-64b3fe841505'; // A valid user ID from participants

    console.log(`Testing insert into messages for conversation ${convId}...`);

    const messagePayload = {
        conversation_id: convId,
        sender_id: senderId,
        content: 'Test message from script',
        is_read: false,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from("messages")
        .insert(messagePayload)
        .select()
        .single();

    if (error) {
        console.error("Insert error:", error);
    } else {
        console.log("Insert success:", data);
        // Clean up
        await supabase.from("messages").delete().eq("id", data.id);
    }
}

testInsert();
