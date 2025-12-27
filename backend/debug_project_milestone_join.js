import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMilestoneFk() {
    console.log('🔍 Checking milestones table join...');
    const { data, error } = await supabase
        .from('projects')
        .select('id, milestones:milestones(*)')
        .limit(1);

    if (error) {
        console.log('❌ Standard Join Error:', error.message);
        // Try with FK name
        const { data: data2, error: error2 } = await supabase
            .from('projects')
            .select('id, milestones:milestones!milestones_project_id_fkey(*)')
            .limit(1);
        if (error2) console.log('❌ FK Join Error:', error2.message);
        else console.log('✅ FK Join Success (milestones_project_id_fkey)');
    } else {
        console.log('✅ Standard Join Success');
    }
}

checkMilestoneFk();
