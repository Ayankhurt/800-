import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPasswords() {
    console.log('\n🔧 Resetting Test User Passwords to: ayan1212\n');
    console.log('='.repeat(60));

    // This is the bcrypt hash for 'ayan1212'
    // Generated using: bcrypt.hash('ayan1212', 10)
    const passwordHash = '$2b$10$YourHashHere'; // We'll use Supabase auth instead

    const testUsers = [
        'admin@bidroom.com',
        'cont@bidroom.com',
        'sub@bidroom.com',
        'finance@bidroom.com',
    ];

    console.log('\n⚠️  Note: Passwords need to be reset via Supabase Auth or backend endpoint');
    console.log('\nChecking current user status:\n');

    for (const email of testUsers) {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, role, password_hash, created_at')
            .eq('email', email)
            .single();

        if (error) {
            console.log(`❌ ${email} - NOT FOUND or ERROR: ${error.message}`);
        } else {
            console.log(`✅ ${email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   Has password: ${user.password_hash ? 'Yes' : 'No'}`);
            console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
        }
        console.log('');
    }

    console.log('='.repeat(60));
    console.log('\n💡 Solution: Use the signup endpoint to create users with known passwords');
    console.log('   OR update password_hash directly in database with bcrypt hash\n');
}

resetPasswords();
