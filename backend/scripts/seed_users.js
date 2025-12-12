import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const roles = [
    { code: 'super_admin', name: 'Super Admin', email: 'super@bidroom.com' },
    { code: 'admin', name: 'Admin User', email: 'admin@bidroom.com' },
    { code: 'finance_manager', name: 'Finance Manager', email: 'finance@bidroom.com' },
    { code: 'moderator', name: 'Moderator', email: 'mod@bidroom.com' },
    { code: 'support_agent', name: 'Support Agent', email: 'support@bidroom.com' },
    { code: 'general_contractor', name: 'General Contractor', email: 'gc@bidroom.com' },
    { code: 'subcontractor', name: 'Subcontractor', email: 'sub@bidroom.com' },
    { code: 'trade_specialist', name: 'Trade Specialist', email: 'trade@bidroom.com' },
    { code: 'project_manager', name: 'Project Manager', email: 'pm@bidroom.com' },
    { code: 'viewer', name: 'Viewer', email: 'viewer@bidroom.com' }
];

const BATCH_SIZE = 50;

async function deleteAllUsers() {
    console.log('🗑️ Deleting all existing users...');

    // 1. Get all users from Auth (using pagination if needed)
    let allUsers = [];
    let { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    allUsers = users;
    console.log(`Found ${allUsers.length} users to delete.`);

    // 2. Delete them
    for (const user of allUsers) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error(`Failed to delete user ${user.email}:`, deleteError.message);
        } else {
            console.log(`Deleted user: ${user.email}`);
        }
    }

    // 3. Clear public.users table just in case (though cascade should handle it ideally, but let's be sure)
    // Note: If using Supabase Auth, deleting from auth.users usually deletes from public.users if allow cascading.
    // We will run a delete on public.users to be safe, but supabase-js client via service role can do it.
    const { error: dbDeleteError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (dbDeleteError) {
        console.log('Note: public.users cleanup might have partly failed or was handled by cascade:', dbDeleteError.message);
    } else {
        console.log('✅ public.users table cleared.');
    }
}

async function seedUsers() {
    console.log('🌱 Seeding new users...');

    for (const role of roles) {
        const password = 'Password123!';

        // 1. Create in Supabase Auth
        const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
            email: role.email,
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: role.name.split(' ')[0],
                last_name: role.name.split(' ').slice(1).join(' ') || 'User',
                role: role.code
            }
        });

        if (createError) {
            console.error(`Failed to create ${role.name}:`, createError.message);
            continue;
        }

        if (!user) {
            console.error(`Failed to create ${role.name}: No user returned.`);
            continue;
        }

        // 2. Ensure they exist in public.users with correct role
        // Triggers might have created the user, but we want to ensure the ROLE is correct.
        // The trigger often copies metadata, but let's force update/insert to be matching our schema.

        // Check if user exists in public.users
        const { data: existingProfile } = await supabase.from('users').select('id').eq('id', user.id).single();

        const profileData = {
            id: user.id,
            email: role.email,
            first_name: role.name.split(' ')[0],
            last_name: role.name.split(' ').slice(1).join(' ') || 'User',
            role: role.code,
            is_active: true,
            created_at: new Date().toISOString()
        };

        if (existingProfile) {
            // Update
            const { error: updateError } = await supabase.from('users').update({
                role: role.code,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                is_active: true
            }).eq('id', user.id);

            if (updateError) console.error(`Failed to update profile for ${role.name}:`, updateError.message);
            else console.log(`✅ Created ${role.name} (${role.email})`);

        } else {
            // Insert (if trigger didn't work)
            const { error: insertError } = await supabase.from('users').insert(profileData);

            if (insertError) console.error(`Failed to create profile for ${role.name}:`, insertError.message);
            else console.log(`✅ Created ${role.name} (${role.email})`);
        }
    }
}

async function main() {
    await deleteAllUsers();
    await seedUsers();
    console.log('✨ Seed operation completed!');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
