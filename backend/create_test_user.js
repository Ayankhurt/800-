import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Must use SERVICE_ROLE_KEY for admin operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const createTestUser = async () => {
    try {
        const email = 'admin@example.com';
        const password = 'password123';

        console.log('Creating test user via Supabase Auth...');

        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: 'Test',
                last_name: 'Admin',
                role: 'admin'
            }
        });

        if (authError) {
            console.log('Auth User creation failed (might already exist):', authError.message);
            // If user exists, we can't easily update password via admin API without ID, 
            // but for test purposes, we assume if it exists, the password is known or we proceed.
        } else {
            console.log('Auth User created:', authData.user.id);
        }

        // 2. Ensure user profile exists in 'users' table (Trigger usually handles this, but we verify/update)
        // We need the user ID from auth, but if creation failed, we need to fetch it.
        // Admin API listUsers is one way, or just select from public.users if we have access.

        const { data: users } = await supabase.from('users').select('id').eq('email', email);
        const user = users?.[0];

        if (user) {
            console.log('User profile found in public.users:', user.id);
            // Update role to admin to ensure permissions
            await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
            console.log('User role verified as admin.');
        } else {
            console.log('WARNING: User profile NOT found in public.users. Trigger might have failed.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
};

createTestUser();
