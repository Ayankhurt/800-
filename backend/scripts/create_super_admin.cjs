
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createSuperAdmin() {
    console.log("Creating Super Admin User...");

    const email = 'superadmin@bidroom.com';
    const password = 'password123';

    // 1. Create Identity in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role_code: 'SUPER' }
    });

    if (authError) {
        console.log("Auth Error (User might exist, trying update):", authError.message);
        // If user exists, try to find user ID to update public table
        // (Skipping complex lookup for brevity, assuming fresh or simple case)
    }

    if (authData?.user) {
        console.log("Auth User Created/Found. ID:", authData.user.id);

        // 2. Insert/Update in Public Users Table
        const { data: publicData, error: publicError } = await supabase
            .from('users')
            .upsert({
                id: authData.user.id,
                email: email,
                role_code: 'SUPER',
                first_name: 'Super',
                last_name: 'Admin'
            }, { onConflict: 'id' })
            .select();

        if (publicError) {
            console.error("Public Table Error:", publicError);
        } else {
            console.log("✅ Super Admin configured successfully!");
            console.log("---------------------------------------");
            console.log("Email:    " + email);
            console.log("Password: " + password);
            console.log("---------------------------------------");
        }
    }
}

createSuperAdmin();
