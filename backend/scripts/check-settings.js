import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { count, error } = await supabase.from('system_settings').select('*', { count: 'exact', head: true });
    console.log('System Settings count:', count, 'Error:', error?.message);
}

check();
