require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnosticCheck() {
    console.log("🔍 Running Comprehensive Diagnostic Check...\n");

    try {
        // 1. Check Jobs Table Schema
        console.log("1️⃣ Testing Jobs Table...");
        const testJob = {
            projects_manager_id: '1b5b736c-0886-412f-9ff4-7d1b1cde199d',
            title: 'Test Job - Diagnostic',
            descriptions: 'Testing job creation',
            budget_min: 1000,
            budget_max: 2000,
            location: 'Test Location',
            trade_type: 'General Contractor',
            status: 'open'
        };

        const { data: jobData, error: jobError } = await supabase
            .from('jobs')
            .insert(testJob)
            .select()
            .single();

        if (jobError) {
            console.log("❌ Jobs Table Error:", jobError.message);
            console.log("   Details:", jobError.details);
            console.log("   Hint:", jobError.hint);
        } else {
            console.log("✅ Jobs Table Working");
            console.log("   Created Job ID:", jobData.id);
            // Clean up
            await supabase.from('jobs').delete().eq('id', jobData.id);
        }

        // 2. Check Job Applications Table
        console.log("\n2️⃣ Testing Job Applications Table...");
        const testApp = {
            job_id: '9e65121e-e4e3-4c6f-8827-ac7ca8eed7e5',
            contractor_id: 'ba79282f-f6e2-44aa-8e96-70807a540049',
            proposed_rate: 1500,
            cover_letter: 'Test application',
            status: 'pending'
        };

        const { data: appData, error: appError } = await supabase
            .from('job_applications')
            .insert(testApp)
            .select()
            .single();

        if (appError) {
            console.log("❌ Job Applications Error:", appError.message);
        } else {
            console.log("✅ Job Applications Working");
            console.log("   Created Application ID:", appData.id);
            // Clean up
            await supabase.from('job_applications').delete().eq('id', appData.id);
        }

        // 3. Check Bids Table
        console.log("\n3️⃣ Testing Bids Table...");
        const testBid = {
            project_manager_id: '1b5b736c-0886-412f-9ff4-7d1b1cde199d',
            contractor_id: 'ba79282f-f6e2-44aa-8e96-70807a540049',
            title: 'Test Bid',
            descriptions: 'Test bid description',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'draft' // Valid enum values: draft, submitted, accepted, rejected, withdrawn
        };

        const { data: bidData, error: bidError } = await supabase
            .from('bids')
            .insert(testBid)
            .select()
            .single();

        if (bidError) {
            console.log("❌ Bids Table Error:", bidError.message);
        } else {
            console.log("✅ Bids Table Working");
            console.log("   Created Bid ID:", bidData.id);
            // Clean up
            await supabase.from('bids').delete().eq('id', bidData.id);
        }

        // 4. Check Projects Table
        console.log("\n4️⃣ Testing Projects Table...");
        const testProject = {
            title: 'Test Project',
            description: 'Test project description',
            owner_id: '1b5b736c-0886-412f-9ff4-7d1b1cde199d',
            contractor_id: 'ba79282f-f6e2-44aa-8e96-70807a540049',
            status: 'active',
            total_amount: 10000 // Added required field
        };

        const { data: projData, error: projError } = await supabase
            .from('projects')
            .insert(testProject)
            .select()
            .single();

        if (projError) {
            console.log("❌ Projects Table Error:", projError.message);
        } else {
            console.log("✅ Projects Table Working");
            console.log("   Created Project ID:", projData.id);
            // Clean up
            await supabase.from('projects').delete().eq('id', projData.id);
        }

        // 5. List Recent Data
        console.log("\n5️⃣ Recent Data Summary:");

        const { data: recentJobs } = await supabase
            .from('jobs')
            .select('id, title, status')
            .order('created_at', { ascending: false })
            .limit(3);

        console.log("   Recent Jobs:", recentJobs?.length || 0);
        if (recentJobs) {
            recentJobs.forEach(j => console.log(`     - ${j.title} (${j.status})`));
        }

        const { data: recentApps } = await supabase
            .from('job_applications')
            .select('id, status')
            .order('created_at', { ascending: false })
            .limit(3);

        console.log("   Recent Applications:", recentApps?.length || 0);

        const { data: recentBids } = await supabase
            .from('bids')
            .select('id, title, status')
            .order('created_at', { ascending: false })
            .limit(3);

        console.log("   Recent Bids:", recentBids?.length || 0);

        const { data: recentProjects } = await supabase
            .from('projects')
            .select('id, title, status')
            .order('created_at', { ascending: false })
            .limit(3);

        console.log("   Recent Projects:", recentProjects?.length || 0);

        console.log("\n✅ Diagnostic Check Complete!");
        console.log("\n📝 Summary:");
        console.log("   - If all tables show ✅, backend is working correctly");
        console.log("   - If you see ❌, check the error messages above");
        console.log("   - Common issues: column name mismatches, missing columns");

    } catch (error) {
        console.error("\n❌ Diagnostic Failed:", error.message);
    }
}

diagnosticCheck();
