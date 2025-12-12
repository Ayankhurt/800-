import { supabase } from "../src/config/supabaseClient.js";

// Read email from command line arg
const email = process.argv[2];
const password = process.argv[3] || "Password@123";

if (!email) {
    console.error("Please provide an email: node scripts/create-super-admin.js <email> [password]");
    process.exit(1);
}

const createSuperAdmin = async () => {
    console.log(`Setting up Super Admin for: ${email}`);

    try {
        let userId;

        // 1. Check if user exists in Auth
        // .listUsers() is pagination based, but filtered in newer client versions or we iterate.
        // Actually, easiest way is to try CreateUser, if it fails saying "already registered", then we find them.
        // OR better: use listUsers with filter if supported, or just getUserById if we knew ID.
        // We only have email. admin.listUsers() returns list.

        // Let's try to CREATE. If exists, it throws error or returns existing? 
        // supabase.auth.admin.createUser returns error if email exists.

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: 'Super Admin',
                role: 'super_admin',
                role_code: 'SUPER',
                account_type: 'ADMIN_USER'
            }
        });

        if (createError) {
            console.log("User might already exist in Auth, fetching details...");
            // If user exists, we need their ID. admin.listUsers() gives us that.
            // But unfortunately listUsers doesn't always support email filtering directly in older libs?
            // Actually, we can use `supabase.from('users')` which is linked to auth usually? 
            // No, public.users is separate. 
            // We can use `getUserByEmail` if available? No.
            // We'll iterate listUsers or just trust public.users if synced.
            // If they are in Auth but not Public, we have a problem finding ID without listUsers.

            // Try fetching from public.users first
            const { data: publicUser } = await supabase.from('users').select('id').eq('email', email).single();

            if (publicUser) {
                userId = publicUser.id;
                console.log(`Found existing user ID in public DB: ${userId}`);
            } else {
                // Try to find in Auth via listUsers (expensive but necessary)
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) throw listError;

                const found = users.find(u => u.email === email);
                if (found) {
                    userId = found.id;
                    console.log(`Found existing user ID in Auth System: ${userId}`);
                } else {
                    throw new Error("Could not create user and could not find them. Weird state.");
                }

                // If we found them in Auth but not Public, we MUST create public record later.
            }

            // If we have ID, update their password if provided explicitly? No, only if newly created.
            // We will just upgrade them.
        } else {
            userId = newUser.user.id;
            console.log(`Created NEW user with ID: ${userId}`);
            console.log(`Password set to: ${password}`);
        }

        // 2. Upsert into public.users (ensures they exist and are super admin)
        const { error: upsertError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email: email,
                role: 'super_admin',
                first_name: 'Super',
                last_name: 'Admin',
                is_active: true,
                // Add admin fields if they exist
                permissions: ['SUPER'],
                ip_whitelist: [],
                two_factor_enabled: false
            })
            .select()
            .single();

        if (upsertError) {
            console.warn("Warning updating public.users:", upsertError.message);
            // Non-fatal if schema mismatch, but we want to try.
        } else {
            console.log("Synced to public.users.");
        }

        // 3. FORCE Update Auth Metadata (Crucial)
        const { error: finalAuthError } = await supabase.auth.admin.updateUserById(
            userId,
            {
                user_metadata: {
                    role: 'super_admin',
                    role_code: 'SUPER',
                    account_type: 'ADMIN_USER',
                    first_name: 'Super',
                    last_name: 'Admin'
                },
                // Also auto-confirm email if strictly needed
                email_confirm: true
            }
        );

        if (finalAuthError) throw finalAuthError;

        console.log("-----------------------------------------");
        console.log("SUCCESS! Super Admin Configured.");
        console.log(`Email: ${email}`);
        if (!createError) console.log(`Password: ${password}`);
        console.log("You can now login.");
        console.log("-----------------------------------------");

    } catch (err) {
        console.error("Failed to setup super admin:", err.message);
    }
};

createSuperAdmin();
