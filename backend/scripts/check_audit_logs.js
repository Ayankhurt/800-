
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuditLogs() {
    console.log('Checking audit_logs table...');
    const { data, error, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching audit_logs:', error);
    } else {
        console.log(`Total logs: ${count}`);
        if (data && data.length > 0) {
            console.log('Latest 5 logs:');
            data.forEach(log => {
                console.log(`- [${log.created_at}] ${log.action_type || log.action} by ${log.user_id}`);
            });
        } else {
            console.log('No logs found.');
        }
    }
    process.exit(0);
}

checkAuditLogs();
