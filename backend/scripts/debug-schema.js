
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking notifications table...');
    const { data: notifData, error: notifError } = await supabase.from('notifications').select('*').limit(1);
    if (notifError) {
        console.error('Notifications fetch error:', notifError);
    } else if (notifData && notifData.length > 0) {
        console.log('Notifications columns:', Object.keys(notifData[0]));
    } else {
        console.log('No notifications found to check columns.');
        // Try to get columns via a more direct way if possible, or just insert/update
    }

    console.log('Checking users table...');
    const { data: userData, error: userError } = await supabase.from('users').select('*').limit(1);
    if (userError) {
        console.error('Users fetch error:', userError);
    } else if (userData && userData.length > 0) {
        console.log('Users columns:', Object.keys(userData[0]));
    }
}

checkSchema();
