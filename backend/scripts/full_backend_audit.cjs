const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TABLES_TO_AUDIT = [
    'users',
    'jobs',
    'projects',
    'bids',
    'bid_submissions',
    'job_applications',
    'appointments',
    'conversations',
    'messages',
    'contractor_profiles',
    'portfolio_items',
    'reviews',
    'notifications',
    'transactions',
    'escrow_transactions',
    'payouts',
    'certifications'
];

async function runFullAudit() {
    console.log('--- STARTING COMPREHENSIVE BACKEND AUDIT ---');
    console.log('Time:', new Date().toISOString());

    for (const table of TABLES_TO_AUDIT) {
        console.log(`\n[Auditing Table: ${table}]`);

        // 1. Check existence and count
        const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: false }).limit(1);

        if (error) {
            if (error.message.includes('not found') || error.code === '42P01') {
                console.error(`❌ MISSING TABLE: The table '${table}' does not exist.`);
            } else {
                console.error(`❌ ERROR querying '${table}':`, error.message);
            }
            continue;
        }

        console.log(`✅ Table exists. Total rows: ${count}`);

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log(`📋 Sample Columns: ${columns.join(', ')}`);

            // Check for common relationship inconsistencies
            checkRelationships(table, columns);
        } else {
            console.log('⚠️  Table is empty. Skipping column analysis.');
        }
    }

    console.log('\n--- AUDIT COMPLETE ---');
}

function checkRelationships(table, columns) {
    const commonFKs = {
        'user_id': 'users(id)',
        'created_by': 'users(id)',
        'projects_manager_id': 'users(id)',
        'owner_id': 'users(id)',
        'contractor_id': 'users(id)',
        'attendee_id': 'users(id)',
        'job_id': 'jobs(id)',
        'jobs_id': 'jobs(id) (Legacy?)',
        'project_id': 'projects(id)',
        'bid_id': 'bids(id)',
        'conversation_id': 'conversations(id)'
    };

    for (const [col, rel] of Object.entries(commonFKs)) {
        if (columns.includes(col)) {
            console.log(`   🔗 Potential Relation: ${col} -> ${rel}`);
        }
    }

    // Specific alerts
    if (table === 'jobs' && !columns.includes('projects_manager_id')) {
        console.warn('   🔸 WARNING: jobs table missing projects_manager_id (PM role)');
    }
    if (table === 'appointments' && !columns.includes('job_id')) {
        console.warn('   🔸 WARNING: appointments table missing job_id (linking to jobs)');
    }
    if (table === 'bids' && columns.includes('jobs_id') && !columns.includes('job_id')) {
        console.warn('   🔸 WARNING: bids uses jobs_id (plural/legacy) instead of job_id');
    }
}

runFullAudit();
