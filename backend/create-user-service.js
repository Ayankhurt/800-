// Create user using SERVICE ROLE (bypasses RLS)
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://zujytrddmmhaxakdvqbv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1anl0cmRkbW1oYXhha2R2cWJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ3OTkyNSwiZXhwIjoyMDgxMDU1OTI1fQ.hwjH5n3JXdIZpdVmGPvzhI7ZVOINFCfTgdMs8bINVzA';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestUser() {
    try {
        console.log('Creating test PM user with service role...\n');

        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'pm@test.com',
            password: 'Test123!',
            email_confirm: true
        });

        if (authError) {
            console.error('Auth error:', authError);
            return;
        }

        console.log('✓ Auth user created:', authData.user.id);

        // 2. Create profile (service role bypasses RLS)
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: 'pm@test.com',
                first_name: 'Test',
                last_name: 'PM',
                user_role: 'project_manager',
                company: 'Test PM Co',
                phone: '+1234567890',
                location: 'New York',
                is_active: true,
                verification_status: 'verified'
            })
            .select()
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            return;
        }

        console.log('✓ Profile created!');
        console.log('\n✅ TEST USER READY:');
        console.log('Email: pm@test.com');
        console.log('Password: Test123!');
        console.log('Role: project_manager (PM)');
        console.log('\nNow you can login and create jobs!');

    } catch (error) {
        console.error('Error:', error);
    }
}

createTestUser();
