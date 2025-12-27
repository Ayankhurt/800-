import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearRateLimits() {
    console.log('\n🔧 Clearing Rate Limits\n');
    console.log('='.repeat(70));

    try {
        // Clear all failed login attempts
        const { data, error } = await supabase
            .from('failed_logins')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            console.log(`❌ Error clearing failed_logins: ${error.message}`);
        } else {
            console.log('✅ All failed login attempts cleared!');
        }

        // Also try to delete specific emails
        const testEmails = [
            'admin@bidroom.com',
            'super@bidroom.com',
            'mod@bidroom.com',
            'support@bidroom.com',
            'finance@bidroom.com',
            'pm@test.com',
            'cont@bidroom.com',
            'sub@bidroom.com',
            'trade@bidroom.com',
        ];

        for (const email of testEmails) {
            await supabase
                .from('failed_logins')
                .delete()
                .eq('email', email);
        }

        console.log('✅ Specific user rate limits cleared!');
        console.log('\n' + '='.repeat(70));
        console.log('\n✅ Rate limit reset complete! You can now login again.\n');

    } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
    }
}

clearRateLimits();
