// Quick test script to create a job directly
import axios from 'axios';

const testJobCreation = async () => {
    try {
        console.log('Testing job creation...\n');

        // First login to get token
        console.log('1. Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
            email: 'test@bidroom.com',
            password: 'Test123!'
        });

        const token = loginRes.data.data.token;
        console.log('✓ Login successful\n');

        // Now create job
        console.log('2. Creating job...');
        const jobData = {
            title: 'Test Construction Job',
            description: 'Testing job creation from script',
            trade_type: 'Plumbing',
            location: 'New York, NY',
            start_date: '2025-01-15',
            budget_min: 5000,
            budget_max: 10000,
            urgency: 'medium',
            requirements: {},
            status: 'open'
        };

        const jobRes = await axios.post('http://localhost:5000/api/v1/jobs', jobData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✓ Job created successfully!');
        console.log('Job ID:', jobRes.data.data.id);
        console.log('Job Title:', jobRes.data.data.title);

    } catch (error) {
        console.error('\n✗ Error Details:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
};

testJobCreation();
