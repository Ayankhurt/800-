import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixJobsData() {
    console.log('🔧 Fixing Jobs Data (Dates & Budgets)...');

    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, start_date, end_date, budget_min, budget_max, created_at, title');

    if (error) {
        console.log('❌ Failed to fetch jobs:', error.message);
        return;
    }

    console.log(`Found ${jobs.length} jobs.`);

    let fixedCount = 0;

    for (const j of jobs) {
        const updates = {};
        let needsUpdate = false;

        // Fix Dates
        if (!j.start_date || !j.end_date) {
            const startDate = j.created_at ? j.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
            const startObj = new Date(startDate);
            startObj.setMonth(startObj.getMonth() + 3); // 3 months timeline
            const endDate = startObj.toISOString().split('T')[0];

            updates.start_date = startDate;
            updates.end_date = endDate;
            needsUpdate = true;
        }

        // Fix Budget
        if (j.budget_min === 0 && j.budget_max === 0) {
            // Extract from title Phase X? Or just default
            let budget = 150000;
            if (j.title.includes('Phase 1')) budget = 150000;
            if (j.title.includes('Phase 2')) budget = 300000;
            if (j.title.includes('Phase 3')) budget = 450000;

            updates.budget_min = budget * 0.9;
            updates.budget_max = budget;
            needsUpdate = true;
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('jobs')
                .update(updates)
                .eq('id', j.id);

            if (updateError) {
                console.log(`   ❌ Failed to fix Job ${j.id}: ${updateError.message}`);
            } else {
                console.log(`   ✅ Fixed Job ${j.id}: Dates & Budget updated`);
                fixedCount++;
            }
        }
    }

    console.log(`\nDone! Fixed ${fixedCount} jobs.`);
}

fixJobsData();
