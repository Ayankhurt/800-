require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalTest() {
    console.log("🎯 FINAL COMPREHENSIVE TEST\n");
    console.log("=".repeat(50));

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    try {
        // Test 1: Create Job (like frontend does)
        console.log("\n1️⃣ TEST: Create Job (Frontend Simulation)");
        const jobData = {
            projects_manager_id: '1b5b736c-0886-412f-9ff4-7d1b1cde199d',
            title: 'Test Kitchen Renovation',
            descriptions: 'Complete kitchen remodel with new cabinets',
            location: 'San Francisco, CA',
            trade_type: 'General Contractor',
            budget_min: 15000,
            budget_max: 25000,
            requirements: {},
            images: [],
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open'
        };

        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert(jobData)
            .select()
            .single();

        if (jobError) {
            console.log("❌ FAILED:", jobError.message);
            results.failed++;
            results.tests.push({ name: 'Create Job', status: 'FAILED', error: jobError.message });
        } else {
            console.log("✅ PASSED - Job ID:", job.id);
            results.passed++;
            results.tests.push({ name: 'Create Job', status: 'PASSED', id: job.id });

            // Test 2: Apply to Job
            console.log("\n2️⃣ TEST: Apply to Job");
            const appData = {
                job_id: job.id,
                contractor_id: 'ba79282f-f6e2-44aa-8e96-70807a540049',
                proposed_rate: 18000,
                cover_letter: 'I have 10 years of experience in kitchen renovations',
                status: 'pending'
            };

            const { data: app, error: appError } = await supabase
                .from('job_applications')
                .insert(appData)
                .select()
                .single();

            if (appError) {
                console.log("❌ FAILED:", appError.message);
                results.failed++;
                results.tests.push({ name: 'Apply to Job', status: 'FAILED', error: appError.message });
            } else {
                console.log("✅ PASSED - Application ID:", app.id);
                results.passed++;
                results.tests.push({ name: 'Apply to Job', status: 'PASSED', id: app.id });

                // Test 3: Update Application Status
                console.log("\n3️⃣ TEST: Update Application Status");
                const { data: updatedApp, error: updateError } = await supabase
                    .from('job_applications')
                    .update({ status: 'accepted' })
                    .eq('id', app.id)
                    .select()
                    .single();

                if (updateError) {
                    console.log("❌ FAILED:", updateError.message);
                    results.failed++;
                    results.tests.push({ name: 'Update Application', status: 'FAILED', error: updateError.message });
                } else {
                    console.log("✅ PASSED - Status:", updatedApp.status);
                    results.passed++;
                    results.tests.push({ name: 'Update Application', status: 'PASSED' });
                }

                // Clean up application
                await supabase.from('job_applications').delete().eq('id', app.id);
            }

            // Test 4: Create Project
            console.log("\n4️⃣ TEST: Create Project");
            const projectData = {
                title: 'Test Bathroom Remodel',
                description: 'Full bathroom renovation',
                owner_id: '1b5b736c-0886-412f-9ff4-7d1b1cde199d',
                contractor_id: 'ba79282f-f6e2-44aa-8e96-70807a540049',
                status: 'active',
                total_amount: 12000
            };

            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert(projectData)
                .select()
                .single();

            if (projectError) {
                console.log("❌ FAILED:", projectError.message);
                results.failed++;
                results.tests.push({ name: 'Create Project', status: 'FAILED', error: projectError.message });
            } else {
                console.log("✅ PASSED - Project ID:", project.id);
                results.passed++;
                results.tests.push({ name: 'Create Project', status: 'PASSED', id: project.id });

                // Clean up project
                await supabase.from('projects').delete().eq('id', project.id);
            }

            // Clean up job
            await supabase.from('jobs').delete().eq('id', job.id);
        }

        // Test 5: Get Jobs List
        console.log("\n5️⃣ TEST: Get Jobs List");
        const { data: jobs, error: getJobsError } = await supabase
            .from('jobs')
            .select('id, title, status')
            .limit(5);

        if (getJobsError) {
            console.log("❌ FAILED:", getJobsError.message);
            results.failed++;
            results.tests.push({ name: 'Get Jobs', status: 'FAILED', error: getJobsError.message });
        } else {
            console.log("✅ PASSED - Found", jobs.length, "jobs");
            results.passed++;
            results.tests.push({ name: 'Get Jobs', status: 'PASSED', count: jobs.length });
        }

        // Final Summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 FINAL RESULTS:");
        console.log("=".repeat(50));
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

        console.log("\n📋 Detailed Results:");
        results.tests.forEach((test, i) => {
            const icon = test.status === 'PASSED' ? '✅' : '❌';
            console.log(`${i + 1}. ${icon} ${test.name}: ${test.status}`);
            if (test.error) console.log(`   Error: ${test.error}`);
        });

        if (results.failed === 0) {
            console.log("\n🎉 ALL TESTS PASSED! System is fully functional!");
        } else {
            console.log("\n⚠️  Some tests failed. Check errors above.");
        }

    } catch (error) {
        console.error("\n❌ Test Suite Failed:", error.message);
    }
}

finalTest();
