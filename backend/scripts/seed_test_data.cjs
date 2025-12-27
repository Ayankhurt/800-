require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedTestData() {
    console.log("🌱 Seeding test data...\n");

    try {
        // 1. Get or create test users
        const pmEmail = 'pikachugaming899@gmail.com';
        const contractorEmail = 'gc@bidroom.com';

        const { data: pmUser } = await supabase.from('users').select('id').eq('email', pmEmail).single();
        const { data: contractorUser } = await supabase.from('users').select('id').eq('email', contractorEmail).single();

        if (!pmUser || !contractorUser) {
            console.log("❌ Test users not found. Please ensure these users exist:");
            console.log("   - PM: pikachugaming899@gmail.com");
            console.log("   - Contractor: gc@bidroom.com");
            return;
        }

        console.log("✅ Found test users");
        console.log(`   PM ID: ${pmUser.id}`);
        console.log(`   Contractor ID: ${contractorUser.id}\n`);

        // 2. Create a test job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert({
                title: 'Kitchen Renovation - Test Job',
                descriptions: 'Complete kitchen renovation including cabinets, countertops, and flooring. This is a test job for development.',
                projects_manager_id: pmUser.id,
                locations: 'San Francisco, CA',
                trade_type: 'General Contractor',
                budget_min: 15000,
                budget_max: 25000,
                status: 'open'
            })
            .select()
            .single();

        if (jobError) {
            console.log("❌ Error creating job:", jobError.message);
            return;
        }

        console.log("✅ Created test job");
        console.log(`   Job ID: ${job.id}`);
        console.log(`   Title: ${job.title}\n`);

        // 3. Create a test project
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert({
                title: 'Bathroom Remodel - Test Project',
                description: 'Full bathroom renovation. This is a test project for development.',
                owner_id: pmUser.id,
                contractor_id: contractorUser.id,
                status: 'active',
                budget: 12000
            })
            .select()
            .single();

        if (projectError) {
            console.log("❌ Error creating project:", projectError.message);
        } else {
            console.log("✅ Created test project");
            console.log(`   Project ID: ${project.id}`);
            console.log(`   Title: ${project.title}\n`);

            // 4. Create a bid invitation for the project
            const { data: bid, error: bidError } = await supabase
                .from('bids')
                .insert({
                    projects_id: project.id,
                    project_manager_id: pmUser.id,
                    contractor_id: contractorUser.id,
                    title: 'Bid for Bathroom Remodel',
                    descriptions: 'Please submit your bid for the bathroom remodel project.',
                    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                })
                .select()
                .single();

            if (bidError) {
                console.log("❌ Error creating bid:", bidError.message);
            } else {
                console.log("✅ Created test bid invitation");
                console.log(`   Bid ID: ${bid.id}`);
                console.log(`   Title: ${bid.title}\n`);
            }
        }

        console.log("\n🎉 Test data seeded successfully!");
        console.log("\n📝 You can now:");
        console.log(`   1. View the job: ${job.id}`);
        console.log(`   2. Submit an application to this job as contractor`);
        console.log(`   3. View the bid invitation (if created successfully)`);
        console.log("\n   Login as contractor: gc@bidroom.com / ayan1212");

    } catch (error) {
        console.error("❌ Error seeding data:", error.message);
    }
}

seedTestData();
