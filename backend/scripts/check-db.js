import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixDatabase() {
    console.log('🔍 Checking database setup...\n');

    try {
        // 1. Check if users table exists
        console.log('1️⃣ Checking users table...');
        const { data: usersCheck, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (usersError) {
            console.error('❌ Users table error:', usersError.message);
            console.log('📝 You need to run schema_complete.sql in Supabase SQL Editor\n');
            return false;
        }
        console.log('✅ Users table exists\n');

        // 2. Check if we can insert a test user
        console.log('2️⃣ Testing user creation...');
        const testEmail = `test-${Date.now()}@example.com`;

        // First create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'Test@123456',
            email_confirm: true,
            user_metadata: {
                first_name: 'Test',
                last_name: 'User',
                role: 'viewer'
            }
        });

        if (authError) {
            console.error('❌ Auth user creation failed:', authError.message);
            return false;
        }

        console.log('✅ Auth user created:', authData.user.id);

        // Try to insert into users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: testEmail,
                first_name: 'Test',
                last_name: 'User',
                role: 'viewer',
                is_active: true,
                verification_status: 'unverified'
            })
            .select()
            .single();

        if (userError) {
            console.error('❌ Users table insert failed:', userError.message);
            console.error('Full error:', JSON.stringify(userError, null, 2));

            // Cleanup auth user
            await supabase.auth.admin.deleteUser(authData.user.id);
            return false;
        }

        console.log('✅ User profile created successfully');
        console.log('User data:', userData);

        // Cleanup test user
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', authData.user.id);
        console.log('✅ Test user cleaned up\n');

        console.log('🎉 Database is properly configured!\n');
        return true;

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        return false;
    }
}

checkAndFixDatabase();
