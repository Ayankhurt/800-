import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProjectStatus() {
    console.log('\n🔍 Checking Project Status Enum Values\n');
    console.log('='.repeat(70));

    // Try to get enum values from database
    const { data: projects, error } = await supabase
        .from('projects')
        .select('status')
        .limit(5);

    if (error) {
        console.log(`Error: ${error.message}`);
    } else {
        console.log('\nExisting project statuses in database:');
        const statuses = [...new Set(projects.map(p => p.status))];
        statuses.forEach(status => console.log(`  - ${status}`));
    }

    // Try different status values
    console.log('\n\n🧪 Testing different status values:\n');

    const testStatuses = [
        'draft',
        'active',
        'in_progress',
        'completed',
        'cancelled',
        'on_hold',
        'pending',
        'planning'
    ];

    for (const status of testStatuses) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    title: `Test Project - ${status}`,
                    description: 'Test project to check valid status',
                    budget: 10000,
                    status: status,
                    owner_id: 'd31de931-11b0-494d-aadf-64b3fe841505' // PM user ID
                })
                .select();

            if (error) {
                console.log(`❌ ${status.padEnd(15)} - INVALID: ${error.message.substring(0, 50)}`);
            } else {
                console.log(`✅ ${status.padEnd(15)} - VALID`);
                // Delete test project
                await supabase.from('projects').delete().eq('id', data[0].id);
            }
        } catch (err) {
            console.log(`❌ ${status.padEnd(15)} - ERROR: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

checkProjectStatus();
