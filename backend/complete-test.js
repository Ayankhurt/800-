// Test job creation with token from signup
import axios from 'axios';

const testWithSignupToken = async () => {
    try {
        console.log('Step 1: Creating new user and getting token...');

        const email = `testpm${Date.now()}@test.com`; // Unique email
        const signupData = {
            email,
            password: 'Test123!',
            first_name: 'Test',
            last_name: 'PM',
            role: 'project_manager',
            company: 'Test Company',
            phone: '+1234567890',
            location: 'New York'
        };

        const signupRes = await axios.post('http://localhost:5000/api/v1/auth/signup', signupData);
        const token = signupRes.data.data.token;
        console.log('✓ User created, Email:', email);
        console.log('✓ Token received\n');

        // Now create job with this token
        console.log('Step 2: Creating job...');
        const jobData = {
            title: 'Quick Test Job',
            description: 'Testing job creation',
            trade_type: 'Plumbing',
            location: 'NYC',
            start_date: '2025-01-20',
            budget_min: 5000,
            budget_max: 10000,
            urgency: 'medium',
            requirements: {},
            status: 'open'
        };

        const jobRes = await axios.post('http://localhost:5000/api/v1/jobs', jobData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ JOB CREATED SUCCESSFULLY!');
        console.log('Job ID:', jobRes.data.data.id);
        console.log('Job Title:', jobRes.data.data.title);
        console.log('\n✓ Jobs posting is WORKING!');

    } catch (error) {
        console.error('\n❌ Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

testWithSignupToken();
