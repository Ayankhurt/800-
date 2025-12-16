/**
 * Check if projects exist in database
 */

import { supabase } from '../src/config/supabaseClient.js';

async function checkProjects() {
    try {
        console.log('🔍 Checking projects in database...\n');

        const { data, error, count } = await supabase
            .from('projects')
            .select('*', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        console.log(`✅ Found ${count} total projects`);
        console.log(`📋 First 5 projects:\n`);

        if (data && data.length > 0) {
            data.forEach((project, index) => {
                console.log(`${index + 1}. ${project.title || 'Untitled'}`);
                console.log(`   ID: ${project.id}`);
                console.log(`   Status: ${project.status}`);
                console.log(`   Owner ID: ${project.owner_id}`);
                console.log('');
            });
        } else {
            console.log('⚠️  No projects found in database!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkProjects();
