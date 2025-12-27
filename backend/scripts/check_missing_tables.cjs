const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TABLES_TO_CHECK = [
    'disputes',
    'support_tickets',
    'contractor_verifications',
    'moderation_reports',
    'project_milestones'
];

async function checkMissingTables() {
    console.log('--- CHECKING CACHED MISSING TABLES ---');
    for (const table of TABLES_TO_CHECK) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table '${table}' ERROR: ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' EXISTS. Rows: ${count}`);
        }
    }
}

checkMissingTables();
