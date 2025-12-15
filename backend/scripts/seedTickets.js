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

async function seedTickets() {
    console.log('Seeding support tickets...');

    // 1. Fetch Users
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .limit(10);

    if (userError || !users || users.length === 0) {
        console.error('No users found or error fetching users:', userError);
        return;
    }

    const categories = ['technical', 'billing', 'account', 'dispute', 'feature_request'];
    const priorities = ['low', 'normal', 'high', 'urgent'];
    const statuses = ['open', 'in_progress', 'resolved', 'closed'];

    const tickets = [];

    // Clear existing tickets first (optional, but good for idempotency if unique constraints exist)
    const { error: deleteError } = await supabase.from('support_tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) console.log("Note: Could not clear table or table empty.");

    for (let i = 0; i < 20; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const ticketNum = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

        tickets.push({
            ticket_number: ticketNum,
            user_id: user.id,
            subject: `Issue regarding ${categories[i % categories.length]} - ${i}`,
            description: `Hello, I'm experiencing a problem with my ${categories[i % categories.length]}. Please assist.`,
            category: categories[i % categories.length],
            priority: priorities[i % priorities.length],
            status: statuses[i % statuses.length],
            created_at: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString()
        });
    }

    const { error } = await supabase.from('support_tickets').insert(tickets);

    if (error) {
        console.error('Error seeding tickets:', error);
    } else {
        console.log('Successfully seeded 20 support tickets.');
    }
}

seedTickets();
