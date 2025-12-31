
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // There is no direct "list tables" in supabase-js, but we can try to query a few likely ones or use a trick
    // Better: Run a raw SQL if we can, but we can't easily.
    // We'll just try to fetch from likely names and see which fail.
    const candidates = ['bid_submissions', 'bids', 'job_applications', 'applications', 'audit_logs', 'logs'];
    for (const table of candidates) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`Table ${table} does NOT exist or error: ${error.message}`);
        } else {
            console.log(`Table ${table} EXISTS.`);
        }
    }
}

listTables();
