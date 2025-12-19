
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedUser() {
    const email = 'pm@bidroom.com';
    const password = 'password123';
    const role = 'project_manager';

    console.log(`Checking for user: ${email}...`);

    // 1. Check if user exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    let user = users.find(u => u.email === email);
    let userId;

    if (user) {
        console.log('User found in Auth. Updating password...');
        userId = user.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true,
            user_metadata: { first_name: 'Project', last_name: 'Manager', role: role }
        });

        if (updateError) {
            console.error('Error updating password:', updateError);
            return;
        }
        console.log('Password updated.');
    } else {
        console.log('User not found in Auth. Creating...');
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { first_name: 'Project', last_name: 'Manager', role: role }
        });

        if (createError) {
            console.error('Error creating user:', createError);
            return;
        }
        userId = createData.user.id;
        console.log('User created in Auth.');
    }

    // 2. Ensure Profile in 'users' table
    console.log('Ensuring profile in public.users table...');
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (!profile) {
        console.log('Profile missing. Inserting...');
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: email,
                first_name: 'Project',
                last_name: 'Manager',
                role: role,
                is_active: true,
                verification_status: 'verified'
            });

        if (insertError) {
            console.error('Error inserting profile:', insertError);
        } else {
            console.log('Profile inserted.');
        }
    } else {
        console.log('Profile already exists.');
        // Optional: Update role if needed
        if (profile.role !== role) {
            await supabase.from('users').update({ role }).eq('id', userId);
            console.log('Profile role updated.');
        }
    }


    // 3. Clear any failed login attempts to ensure account is unlocked
    console.log('Clearing failed login attempts...');
    const { error: unlockError } = await supabase
        .from('failed_logins')
        .delete()
        .eq('email', email);

    if (unlockError) {
        console.error('Error clearing failed logins:', unlockError);
    } else {
        console.log('Account unlocked (failed_logins cleared).');
    }

    console.log(`\nSUCCESS! User ${email} is ready.`);
    console.log(`Login with password: ${password}`);
}

seedUser();
