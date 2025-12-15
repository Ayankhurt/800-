
import { supabase } from '../src/config/supabaseClient.js';

async function listAdminUsers() {
    console.log('Listing admin users...');
    // Try to query admin_users table
    try {
        const { data: admins, error } = await supabase
            .from('admin_users')
            .select('*');

        if (error) {
            console.error('Error fetching admin_users:', error.message);
            // Try 'admins' table?
            const { data: admins2, error: error2 } = await supabase.from('admins').select('*');
            if (error2) console.error('Error fetching admins:', error2.message);
            else console.log('Admins found in admins table:', admins2);
        } else {
            console.log('Admins found in admin_users:', admins);
        }
    } catch (e) {
        console.error(e);
    }
}

listAdminUsers();
