import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedChats() {
    console.log('Seeding project chats...');

    // 1. Get projects that have disputes
    const { data: disputes, error: disputeError } = await supabase
        .from('disputes')
        .select(`
            project_id,
            raised_by, 
            project:projects (
                id, 
                owner_id, 
                contractor_id
            )
        `);

    if (disputeError) {
        console.error('Error fetching disputes:', disputeError);
        return;
    }

    if (!disputes || disputes.length === 0) {
        console.log('No disputes found to seed chats for.');
        return;
    }

    console.log(`Found ${disputes.length} disputed projects.`);

    for (const dispute of disputes) {
        const project = dispute.project;
        if (!project) continue;

        const ownerId = project.owner_id;
        const contractorId = project.contractor_id;

        // 2. Create or Get Conversation
        let conversationId;
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('project_id', project.id)
            .single();

        if (existingConv) {
            conversationId = existingConv.id;
        } else {
            const { data: newConv, error: convError } = await supabase
                .from('conversations')
                .insert({ project_id: project.id })
                .select()
                .single();

            if (convError) {
                console.error(`Error creating conversation for project ${project.id}:`, convError);
                continue;
            }
            conversationId = newConv.id;
        }

        console.log(`Processing conversation ${conversationId} for project ${project.id}`);

        // 3. Check existing messages
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId);

        if (count > 0) {
            console.log('Messages already exist. Skipping.');
            continue;
        }

        // 4. Insert Fake Messages
        const messages = [
            {
                conversation_id: conversationId,
                sender_id: ownerId,
                content: "Hi, when are you planning to start the kitchen tiling?",
                created_at: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
            },
            {
                conversation_id: conversationId,
                sender_id: contractorId,
                content: "We are waiting for the specific grout you requested. It was out of stock.",
                created_at: new Date(Date.now() - 86400000 * 4.5).toISOString()
            },
            {
                conversation_id: conversationId,
                sender_id: ownerId,
                content: "You said you ordered it two weeks ago! This is delaying everything.",
                created_at: new Date(Date.now() - 86400000 * 4).toISOString()
            },
            {
                conversation_id: conversationId,
                sender_id: contractorId,
                content: "I understand the frustration, but I cannot control the supplier delays.",
                created_at: new Date(Date.now() - 86400000 * 3).toISOString()
            },
            {
                conversation_id: conversationId,
                sender_id: ownerId,
                content: "If you don't start by Monday, I'm going to file a dispute.",
                created_at: new Date(Date.now() - 86400000 * 2).toISOString()
            }
        ];

        const { error: msgError } = await supabase
            .from('messages')
            .insert(messages);

        if (msgError) {
            console.error('Error inserting messages:', msgError);
        } else {
            console.log('Inserted sample messages successfully.');
        }
    }

    console.log('Chat seeding complete.');
}

seedChats();
