import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixProjectDates() {
    console.log('🔧 Fixing Missing Project Dates...');

    // 1. Get all projects
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, start_date, end_date, created_at');

    if (error) {
        console.log('❌ Failed to fetch projects:', error.message);
        return;
    }

    console.log(`Found ${projects.length} projects.`);

    let fixedCount = 0;

    for (const p of projects) {
        if (!p.start_date || !p.end_date) {
            // Use created_at or now as start date
            const startDate = p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
            // End date = start date + 6 months
            const startObj = new Date(startDate);
            startObj.setMonth(startObj.getMonth() + 6);
            const endDate = startObj.toISOString().split('T')[0];

            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    start_date: startDate,
                    end_date: endDate
                })
                .eq('id', p.id);

            if (updateError) {
                console.log(`   ❌ Failed to fix Project ${p.id}: ${updateError.message}`);
            } else {
                console.log(`   ✅ Fixed Project ${p.id}: ${startDate} -> ${endDate}`);
                fixedCount++;
            }
        }
    }

    console.log(`\nDone! Fixed ${fixedCount} projects.`);
}

fixProjectDates();
