import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMilestoneCreation() {
    console.log('\n🧪 Verifying Milestone Creation (Final Check)\n');

    // 1. Get a valid project ID first
    const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

    if (!projects || projects.length === 0) {
        console.log('Skipping verification: No projects found to attach milestone to.');
        return;
    }

    const projectId = projects[0].id;
    console.log(`Using Project ID: ${projectId}`);

    // 2. Try to create milestone WITHOUT description
    const milestoneData = {
        project_id: projectId,
        title: 'Verification Milestone',
        amount: 5000,
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending'
    };

    const { data, error } = await supabase
        .from('milestones')
        .insert([milestoneData])
        .select();

    if (error) {
        console.log('❌ Creation Failed:', error.message);
    } else {
        console.log('✅ Creation Successful!');
        console.log('   ID:', data[0].id);

        // Cleanup
        await supabase.from('milestones').delete().eq('id', data[0].id);
        console.log('   (Cleanup complete)');
    }
}

verifyMilestoneCreation();
