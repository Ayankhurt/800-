import { supabase } from "../src/config/supabaseClient.js";

const NEW_PASSWORD = 'ayan1212';

const resetPasswords = async () => {
    console.log('Fetching all users...');

    // List all users. Note: listUsers defaults to page 1, 50 users. 
    // For a complete script we might need pagination, but let's start with this.
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Found ${users.length} users. Resetting passwords to '${NEW_PASSWORD}'...`);

    for (const user of users) {
        console.log(`Resetting password for ${user.email} (${user.id})...`);

        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: NEW_PASSWORD }
        );

        if (updateError) {
            console.error(`Failed to update password for ${user.email}:`, updateError.message);
        } else {
            console.log(`Success: ${user.email}`);
        }
    }

    console.log('All done!');
    process.exit(0);
};

resetPasswords();
