import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api/v1';
const EMAIL = 'admin@example.com'; // Ensure this user exists or use a valid one
const PASSWORD = 'password123'; // Ensure this matches

const testApis = async () => {
    try {
        console.log('1. Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.data.token;
        console.log('   Authentication successful. Token received.');

        const headers = { Authorization: `Bearer ${token}` };

        // List of GET endpoints to test
        const endpoints = [
            // '/users/me',
            '/jobs',
            '/projects',
            '/finance/transactions',
            '/communication/conversations',
            '/notifications',
            '/admin/users', // Assuming admin role
            '/admin/dashboard/stats'
        ];

        console.log('\n2. Testing GET Endpoints...');

        for (const endpoint of endpoints) {
            try {
                const res = await axios.get(`${API_URL}${endpoint}`, { headers });
                console.log(`   [PASS] GET ${endpoint} - Status: ${res.status}`);
            } catch (err) {
                console.log(`   [FAIL] GET ${endpoint} - Status: ${err.response?.status || 'Error'} - ${err.message}`);
            }
        }

        console.log('\n3. Testing Data Creation (Dry Run)...');
        // Example: Create a dummy job (commented out to avoid clutter, but ready to use)
        /*
        try {
          const jobRes = await axios.post(`${API_URL}/jobs`, {
            title: 'Test Job via Script',
            description: 'This is a test job created by the verification script.',
            budget_min: 100,
            budget_max: 500,
            location: 'Remote',
            trade_type: 'Plumbing',
            urgency: 'medium'
          }, { headers });
          console.log(`   [PASS] POST /jobs - Created Job ID: ${jobRes.data.data.id}`);
        } catch (err) {
          console.log(`   [FAIL] POST /jobs - ${err.message}`);
        }
        */
        console.log('   Skipping creation to preserve clean state. Uncomment in script to run.');

        console.log('\nDone.');

    } catch (err) {
        console.error('CRITICAL FAILURE:', err);
    }
};

testApis();
