const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMFALogs() {
    console.log('--- Checking Login Logs ---');
    const { data: logs, error: logsError } = await supabase
        .from('login_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (logsError) {
        console.error('Logs Error:', logsError);
    } else {
        console.table(logs.map(l => ({
            id: l.id,
            email: l.email_attempted,
            success: l.success,
            reason: l.reason,
            created_at: l.created_at
        })));
    }

    console.log('\n--- Checking User MFA info ---');
    // Find the latest attempted email from logs
    const latestEmail = logs && logs.length > 0 ? logs[0].email_attempted : null;
    if (latestEmail) {
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email, two_factor_enabled, two_factor_secret')
            .eq('email', latestEmail)
            .single();

        if (userError) {
            console.error('User Error:', userError);
        } else {
            console.log('User MFA status:', {
                id: users.id,
                email: users.email,
                enabled: users.two_factor_enabled,
                hasSecret: !!users.two_factor_secret,
                secretPrefix: users.two_factor_secret ? users.two_factor_secret.substring(0, 4) + '...' : 'none'
            });
        }
    }
}

checkMFALogs();
