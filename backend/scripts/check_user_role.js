
import { supabase } from '../src/config/supabaseClient.js';

async function checkUserRole() {
    console.log('Checking user role for support@bidroom.com...');
    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', 'support@bidroom.com')
        .single();

    if (error) {
        console.error('Error fetching user:', error);
    } else {
        console.log('User Role Info:', user);
    }
}

checkUserRole();
