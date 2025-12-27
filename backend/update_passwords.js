import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pkg from 'bcryptjs';
const { hash } = pkg;

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateAllPasswords() {
    console.log('\n🔧 Setting Password "ayan1212" for All Test Users\n');
    console.log('='.repeat(70));

    const newPassword = 'ayan1212';
    const hashedPassword = await hash(newPassword, 10);

    console.log(`\n✅ Generated bcrypt hash for password: ${newPassword}`);
    console.log(`   Hash: ${hashedPassword.substring(0, 30)}...`);

    const testUsers = [
        'admin@bidroom.com',
        'pm@test.com',
        'cont@bidroom.com',
        'sub@bidroom.com',
        'finance@bidroom.com',
        'super@bidroom.com',
        'mod@bidroom.com',
        'support@bidroom.com',
        'ts@test.com',
    ];

    console.log(`\n📝 Updating passwords for ${testUsers.length} users...\n`);

    for (const email of testUsers) {
        try {
            // Update password field (not password_hash)
            const { data, error } = await supabase
                .from('users')
                .update({ password: hashedPassword })
                .eq('email', email)
                .select('id, email, role');

            if (error) {
                console.log(`❌ ${email} - ERROR: ${error.message}`);
            } else if (data && data.length > 0) {
                console.log(`✅ ${email} - Password updated successfully`);
                console.log(`   Role: ${data[0].role}`);
            } else {
                console.log(`⚠️  ${email} - User not found`);
            }
        } catch (err) {
            console.log(`❌ ${email} - Exception: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Password update complete! All users now have password: ayan1212\n');
}

updateAllPasswords();
