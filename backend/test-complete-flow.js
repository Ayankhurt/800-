// Test complete flow: login → create job → verify
import axios from 'axios';

async function testCompleteFlow() {
    try {
        console.log('=== TESTING COMPLETE JOBS FLOW ===\n');

        // Step 1: Login
        console.log('1. Logging in as PM...');
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'pm@test.com',
            password: 'Test123!'
        });

        if (!loginRes.data.success) {
            console.error('❌ Login failed:', loginRes.data.message);
            return;
        }

        const token = loginRes.data.data.token;
        const user = loginRes.data.data.user;
        console.log('✅ Login successful!');
        console.log('   User:', user.first_name, user.last_name);
        console.log('   Role:', user.user_role);
        console.log('   Token:', token.substring(0, 30) + '...\n');

        // Step 2: Create Job
        console.log('2. Creating job...');
        const jobData = {
            title: `Test Job ${Date.now()}`,
            description: 'Testing complete job creation flow',
            trade_type: 'Plumbing',
            location: 'New York, NY',
            start_date: '2025-01-20',
            end_date: '2025-02-20',
            budget_min: 5000,
            budget_max: 10000,
            pay_rate: '$50/hour',
            urgency: 'medium',
            requirements: {},
            status: 'open'
        };

        const jobRes = await axios.post('http://localhost:5000/api/v1/jobs', jobData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!jobRes.data.success) {
            console.error('❌ Job creation failed:', jobRes.data.message);
            return;
        }

        console.log('✅ Job created successfully!');
        console.log('   Job ID:', jobRes.data.data.id);
        console.log('   Title:', jobRes.data.data.title);
        console.log('   Trade:', jobRes.data.data.trade_type);
        console.log('   Budget:', jobRes.data.data.budget_min, '-', jobRes.data.data.budget_max, '\n');

        // Step 3: Fetch all jobs
        console.log('3. Fetching all jobs...');
        const getJobsRes = await axios.get('http://localhost:5000/api/v1/jobs', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!getJobsRes.data.success) {
            console.error('❌ Failed to fetch jobs');
            return;
        }

        const jobs = getJobsRes.data.data.jobs || [];
        console.log('✅ Jobs fetched!');
        console.log('   Total jobs:', jobs.length);
        console.log('   Latest job:', jobs[jobs.length - 1]?.title);

        console.log('\n🎉 ALL TESTS PASSED! Jobs module is working!');
        console.log('\n✓ Login working');
        console.log('✓ Job creation working');
        console.log('✓ Job fetching working');

    } catch (error) {
        console.error('\n❌ TEST FAILED:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testCompleteFlow();
