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
    console.log('Fetching users...');
    const { data: users, error: uErr } = await supabase.from('users').select('id');

    if (uErr) { console.error('Error fetching users:', uErr); return; }
    if (!users || users.length < 2) { console.log('Need at least 2 users'); return; }

    const projects = [];
    const statuses = ['setup', 'active', 'completed', 'disputed', 'cancelled'];
    const trades = ['Plumbing', 'Electrical', 'Carpentry', 'Roofing', 'General Construction'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'];

    console.log('Generating 10 dummy projects...');

    for (let i = 0; i < 10; i++) {
        const owner = users[Math.floor(Math.random() * users.length)];
        const contractor = users[Math.floor(Math.random() * users.length)];

        projects.push({
            title: `${trades[Math.floor(Math.random() * trades.length)]} Renovation in ${cities[Math.floor(Math.random() * cities.length)]}`,
            description: 'This is a dummy project created for testing the Admin Panel functionality.',
            status: statuses[Math.floor(Math.random() * statuses.length)],
            owner_id: owner.id,
            contractor_id: contractor.id,
            total_amount: Math.floor(Math.random() * 50000) + 5000,
            paid_amount: Math.floor(Math.random() * 5000),
            // currency: 'USD', // Not in schema
            start_date: new Date().toISOString(),
            created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
        });
    }

    const { error } = await supabase.from('projects').insert(projects);
    if (error) {
        console.error('Error seeding projects:', error);
    } else {
        console.log('Successfully seeded 10 projects!');
    }
}

seed();
