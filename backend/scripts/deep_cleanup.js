import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepCleanup() {
    console.log('🧹 Starting deep cleanup...');

    // Delete dependent tables first (in reverse dependency order)
    const tables = [
        'notifications',
        'audit_logs',
        'content_reports',
        'verification_requests',
        'support_tickets',
        'transactions',
        'disputes',
        'payouts',
        'payments',
        'escrow_transactions',
        'project_milestones',
        'bid_submissions',
        'bids',
        'job_applications',
        'jobs',
        'reviews',
        'quotes', // references users
        'saved_contractors', // references users
        'video_consultations', // references users
        'profile_views', // references users
        'projects',
        'users' // finally users
    ];

    for (const table of tables) {
        try {
            // Delete all records
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) {
                console.error(`❌ Failed to clear ${table}: ${error.message}`);
            } else {
                console.log(`✅ Cleared ${table}`);
            }
        } catch (e) {
            console.error(`Error processing ${table}: ${e.message}`);
        }
    }

    console.log('Cleanup finished. Now run seed.');
}

deepCleanup();
