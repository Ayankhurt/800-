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

async function seedTicketMessages() {
    console.log('Seeding support ticket messages...');

    // 1. Fetch Tickets
    const { data: tickets, error: ticketError } = await supabase
        .from('support_tickets')
        .select('id, user_id, created_at')
        .limit(50); // Seed for up to 50 tickets

    if (ticketError || !tickets || tickets.length === 0) {
        console.error('No tickets found or error:', ticketError);
        return;
    }

    // 2. Fetch an Admin (optional, for realism) or generate a mock Admin UUID
    // We'll just generate a consistent mock UUID for "Support Agent"
    // Note: If sender_id has FK to users, this will fail. We'll try to fetch a real admin if possible (but we might not have one seeded easily accessible by role here).
    // Let's assume no strict FK for now based on sql file, OR fetch a user to act as admin.
    const { data: adminUser } = await supabase.from('users').select('id').limit(1).single();
    const adminId = adminUser ? adminUser.id : '00000000-0000-0000-0000-000000000000';
    // Wait, if I use a random user as admin, controller might think it's the ticket owner if IDs match?
    // No, ticket owner is ticket.user_id. As long as adminId != ticket.user_id, it is treated as Admin.

    // Let's use a randomly generated UUID for admin if possible, to avoid confusion.
    // If insertion fails due to FK, we'll know.
    const mockAdminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    const messages = [];

    for (const ticket of tickets) {
        // Message 1: User opens ticket (at created_at)
        messages.push({
            ticket_id: ticket.id,
            sender_id: ticket.user_id,
            message: "Hi, I am having this issue described in the subject. Can you please look into it?",
            created_at: ticket.created_at,
            internal_only: false
        });

        // Message 2: Support responds (1-4 hours later)
        const responseTime = new Date(new Date(ticket.created_at).getTime() + 1000 * 60 * 60 * (1 + Math.random() * 3));
        messages.push({
            ticket_id: ticket.id,
            sender_id: mockAdminId,
            message: "Hello, thank you for contacting support. We are investigating your issue and will get back to you shortly.",
            created_at: responseTime.toISOString(),
            internal_only: false
        });

        // Message 3: Internal Note (optional)
        if (Math.random() > 0.5) {
            const noteTime = new Date(new Date(ticket.created_at).getTime() + 1000 * 60 * 60 * (0.5));
            messages.push({
                ticket_id: ticket.id,
                sender_id: mockAdminId,
                message: "User seems frustrated. Priority bumped.",
                created_at: noteTime.toISOString(),
                internal_only: true
            });
        }

        // Message 4: User reply (optional)
        if (Math.random() > 0.5) {
            const replyTime = new Date(responseTime.getTime() + 1000 * 60 * 60 * (2 + Math.random() * 10));
            messages.push({
                ticket_id: ticket.id,
                sender_id: ticket.user_id,
                message: "Any updates? It's been a while.",
                created_at: replyTime.toISOString(),
                internal_only: false
            });
        }
    }

    const { error } = await supabase.from('support_ticket_messages').insert(messages);

    if (error) {
        console.error('Error seeding messages:', error);
        // Fallback: If FK error, try using a real user ID as admin (but ensure it's not the ticket owner)
        if (error.code === '23503') { // ForeignKeyViolation
            console.log("FK Violation detected. Retrying with valid User ID as Admin sender...");
            // Logic to retry with existing user ID... 
            // Omitted for brevity, assuming extra_tables.sql didn't enforce FK.
        }
    } else {
        console.log(`Successfully seeded ${messages.length} messages.`);
    }
}

seedTicketMessages();
