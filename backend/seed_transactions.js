import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE env vars');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    console.log('Fetching users/projects...');
    const { data: users, error: uErr } = await supabase.from('users').select('id');
    const { data: projects, error: pErr } = await supabase.from('projects').select('id');

    if (uErr) console.error('Users error:', uErr);
    if (pErr) console.error('Projects error:', pErr);

    if (!users || users.length < 2) {
        console.log('Not enough users to create transactions. Need at least 2.');
        // Create 2 users if needed? No, assuming users exist from previous steps.
        return;
    }

    // Create 20 transactions
    const txs = [];
    const statuses = ['completed', 'pending', 'failed'];
    const types = ['deposit', 'milestone_release', 'refund', 'fee'];

    console.log(`Generating transactions using ${users.length} users and ${projects?.length || 0} projects...`);

    for (let i = 0; i < 20; i++) {
        const sender = users[Math.floor(Math.random() * users.length)];
        const receiver = users[Math.floor(Math.random() * users.length)];
        const project = projects && projects.length > 0 ? projects[Math.floor(Math.random() * projects.length)] : null;

        txs.push({
            project_id: project?.id || null, // Can be null
            sender_id: sender.id,
            receiver_id: receiver.id, // Can be null per schema, but using user here
            amount: (Math.random() * 5000 + 100).toFixed(2),
            type: types[Math.floor(Math.random() * types.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            stripe_payment_id: `ch_fake_${Math.random().toString(36).substring(7)}`,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString() // Random time in past ~4 months
        });
    }

    const { error } = await supabase.from('transactions').insert(txs);
    if (error) {
        console.error('Error inserting transactions:', error);
    } else {
        console.log('Successfully seeded 20 transactions!');
    }
}

seed();
