import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMilestonesTable() {
    console.log('\n🔍 Checking Milestones Table\n');
    console.log('='.repeat(70));

    // Check if milestones table exists
    const { data: tables, error: tableError } = await supabase
        .from('milestones')
        .select('*')
        .limit(1);

    if (tableError) {
        console.log('\n❌ Milestones table error:', tableError.message);
        console.log('\n💡 Table may not exist or has schema issues');

        // Try to get table structure
        console.log('\n📋 Checking database schema...');

        // Check what tables exist
        const { data: allTables } = await supabase
            .rpc('get_tables');

        console.log('\nAvailable tables:', allTables);
    } else {
        console.log('\n✅ Milestones table exists!');
        console.log(`   Found ${tables?.length || 0} milestone(s)`);

        if (tables && tables.length > 0) {
            console.log('\n📋 Sample milestone structure:');
            console.log(JSON.stringify(tables[0], null, 2));
        }
    }

    // Try to create a test milestone
    console.log('\n\n🧪 Testing milestone creation...');

    const testMilestone = {
        project_id: 'a14ac204-7ed0-4b1c-9108-5f923ad79add', // From recent test
        title: 'Test Milestone',
        description: 'Testing milestone creation',
        amount: 10000,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
    };

    const { data: created, error: createError } = await supabase
        .from('milestones')
        .insert([testMilestone])
        .select();

    if (createError) {
        console.log('\n❌ Failed to create milestone:');
        console.log('   Error:', createError.message);
        console.log('   Details:', createError.details);
        console.log('   Hint:', createError.hint);
    } else {
        console.log('\n✅ Milestone created successfully!');
        console.log('   ID:', created[0].id);

        // Clean up test milestone
        await supabase.from('milestones').delete().eq('id', created[0].id);
        console.log('   (Test milestone deleted)');
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

checkMilestonesTable();
