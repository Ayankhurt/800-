
import { supabase } from '../src/config/supabaseClient.js';

async function listUsers() {
    console.log('Listing users...');
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, first_name, last_name')
        .limit(20);

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Users found:', users);
    }
}

listUsers();
