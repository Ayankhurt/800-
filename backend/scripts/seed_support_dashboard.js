
import { supabase } from '../src/config/supabaseClient.js';

async function seedSupportData() {
    console.log('Seeding support data (corrected)...');

    try {
        // 1. Get some users
        const { data: users } = await supabase.from('users').select('id').limit(5);
        if (!users || users.length === 0) {
            console.log('No users found.');
            return;
        }

        // 2. Seed Contractor Verifications
        const verifications = [
            {
                contractor_id: users[0].id,
                verification_status: 'pending',
                verification_type: 'identity',
                created_at: new Date().toISOString()
            },
            {
                contractor_id: users[1]?.id || users[0].id,
                verification_status: 'pending',
                verification_type: 'business',
                created_at: new Date().toISOString()
            }
        ];

        const { error: vError } = await supabase.from('contractor_verifications').insert(verifications);
        if (vError) console.error('Error seeding verifications:', vError.message);
        else console.log('Seeded verification requests.');

    } catch (err) {
        console.error('Seeding error:', err);
    }
}

seedSupportData();
