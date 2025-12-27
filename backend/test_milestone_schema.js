import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getMilestonesSchema() {
    console.log('\n📋 Getting Milestones Table Schema\n');
    console.log('='.repeat(70));

    // Get column information
    const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'milestones' })
        .catch(() => null);

    // Alternative: Try to insert with minimal data to see what's required
    console.log('\n🧪 Testing with minimal data...\n');

    const tests = [
        { title: 'Test 1' },
        { title: 'Test 2', project_id: 'a14ac204-7ed0-4b1c-9108-5f923ad79add' },
        {
            title: 'Test 3',
            project_id: 'a14ac204-7ed0-4b1c-9108-5f923ad79add',
            amount: 10000
        },
        {
            title: 'Test 4',
            project_id: 'a14ac204-7ed0-4b1c-9108-5f923ad79add',
            amount: 10000,
            due_date: '2025-01-26'
        },
    ];

    for (let i = 0; i < tests.length; i++) {
        const { data: result, error: testError } = await supabase
            .from('milestones')
            .insert([tests[i]])
            .select();

        if (testError) {
            console.log(`❌ Test ${i + 1} failed: ${testError.message}`);
        } else {
            console.log(`✅ Test ${i + 1} SUCCESS!`);
            console.log('   Data:', JSON.stringify(tests[i], null, 2));
            console.log('   Created:', result[0]);

            // Clean up
            await supabase.from('milestones').delete().eq('id', result[0].id);
            break; // Found working combination
        }
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

getMilestonesSchema();
