import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Seeding Escrow Tables v4 (deposited_by)...');

    // 1. Get Project
    const { data: projects, error: pError } = await supabase.from('projects').select('id, owner_id').limit(1);
    if (pError || !projects || projects.length === 0) {
        console.error('No projects found.');
        return;
    }
    const project = projects[0];
    console.log(`Using Project ID: ${project.id}, Owner: ${project.owner_id}`);

    // 2. Insert Escrow Account
    const account = {
        project_id: project.id,
        balance: 5000.00,
        status: 'active',
        created_at: new Date().toISOString()
    };

    const { data: existing } = await supabase.from('escrow_accounts').select('id').eq('project_id', project.id).single();
    if (!existing) {
        const { error: accError } = await supabase.from('escrow_accounts').insert(account);
        if (accError) console.error('Account Insert Error:', accError.message);
        else console.log('Escrow Account Seeded.');
    } else {
        console.log('Escrow Account already exists.');
    }

    // 3. Insert Escrow Transactions
    const tx1 = {
        project_id: project.id,
        amount: 3500.00,
        status: 'held',
        deposited_by: project.owner_id,
        created_at: new Date().toISOString()
    };

    const { error: txError1 } = await supabase.from('escrow_transactions').insert(tx1);
    if (txError1) console.error('TX1 Error:', txError1.message);
    else console.log('Escrow Transaction 1 (Held) Seeded.');

    const tx2 = {
        project_id: project.id,
        amount: 1500.00,
        status: 'released',
        deposited_by: project.owner_id,
        created_at: new Date().toISOString()
    };

    const { error: txError2 } = await supabase.from('escrow_transactions').insert(tx2);
    if (txError2) console.error('TX2 Error:', txError2.message);
    else console.log('Escrow Transaction 2 (Released) Seeded.');
}

run();
