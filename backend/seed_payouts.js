import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedPayouts() {
    console.log('🌱 Starting payout seeding...');

    try {
        // First, get some users from the users table (any role)
        const { data: contractors, error: contractorsError } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, role')
            .limit(3);

        if (contractorsError) {
            console.error('Error fetching contractors:', contractorsError);
            return;
        }

        if (!contractors || contractors.length === 0) {
            console.log('⚠️  No contractors found. Creating sample contractors first...');

            // Create sample contractors
            const { data: newContractors, error: createError } = await supabase
                .from('users')
                .insert([
                    {
                        email: 'contractor1@example.com',
                        first_name: 'John',
                        last_name: 'Builder',
                        role: 'tradesperson',
                        is_active: true,
                        verification_status: 'verified'
                    },
                    {
                        email: 'contractor2@example.com',
                        first_name: 'Sarah',
                        last_name: 'Carpenter',
                        role: 'tradesperson',
                        is_active: true,
                        verification_status: 'verified'
                    },
                    {
                        email: 'contractor3@example.com',
                        first_name: 'Mike',
                        last_name: 'Electrician',
                        role: 'tradesperson',
                        is_active: true,
                        verification_status: 'verified'
                    }
                ])
                .select();

            if (createError) {
                console.error('Error creating contractors:', createError);
                return;
            }

            contractors.push(...newContractors);
            console.log('✅ Created sample contractors');
        }

        console.log(`Found ${contractors.length} contractors`);

        // Create sample payouts
        const payouts = [
            {
                contractor_id: contractors[0].id,
                amount: 2500.00,
                status: 'pending',
                created_at: new Date().toISOString()
            },
            {
                contractor_id: contractors[1]?.id || contractors[0].id,
                amount: 3750.50,
                status: 'approved',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
            },
            {
                contractor_id: contractors[2]?.id || contractors[0].id,
                amount: 5000.00,
                status: 'processing',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
            },
            {
                contractor_id: contractors[0].id,
                amount: 1500.00,
                status: 'completed',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
            },
            {
                contractor_id: contractors[1]?.id || contractors[0].id,
                amount: 850.00,
                status: 'failed',
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
            },
            {
                contractor_id: contractors[2]?.id || contractors[0].id,
                amount: 4200.00,
                status: 'held',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
            }
        ];
        console.log('📝 Inserting payouts...');
        const { data: insertedPayouts, error: insertError } = await supabase
            .from('payouts')
            .insert(payouts)
            .select();

        if (insertError) {
            console.error('❌ Error inserting payouts:', insertError);
            return;
        }

        console.log(`✅ Successfully seeded ${insertedPayouts.length} payouts!`);
        console.log('\nPayout Summary:');
        console.log('- Pending:', payouts.filter(p => p.status === 'pending').length);
        console.log('- Approved:', payouts.filter(p => p.status === 'approved').length);
        console.log('- Processing:', payouts.filter(p => p.status === 'processing').length);
        console.log('- Completed:', payouts.filter(p => p.status === 'completed').length);
        console.log('- Failed:', payouts.filter(p => p.status === 'failed').length);
        console.log('- Held:', payouts.filter(p => p.status === 'held').length);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedPayouts();
