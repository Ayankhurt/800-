
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
// Use the temp support agent token or admin token if possible.
// I will just use the admin token from a fresh login.
const EMAIL = 'admin@bidroom.com';
const PASSWORD = 'ayan1212'; // Default seed password

async function verifyAllRoutes() {
    console.log('Starting Route Verification...');

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/admin/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('Login successful.');

        // 2. Define Routes to Check (based on Admin Panel structure)
        const routesToCheck = [
            { name: 'Dashboard Stats', url: `${BASE_URL}/stats/admin-dashboard`, method: 'GET' },
            { name: 'Users List', url: `${BASE_URL}/admin/users?page=1&limit=10`, method: 'GET' },
            { name: 'Jobs List', url: `${BASE_URL}/jobs?page=1&limit=10`, method: 'GET' }, // Backend route might be /jobs or /admin/jobs
            // Let's check apiService for correct routes
            { name: 'Disputes List', url: `${BASE_URL}/disputes?page=1&limit=10`, method: 'GET' },
            { name: 'Support Tickets', url: `${BASE_URL}/admin/support/tickets`, method: 'GET' },
            { name: 'Financial Stats', url: `${BASE_URL}/stats/financial-summary`, method: 'GET' }, // Guessing
            { name: 'Transactions', url: `${BASE_URL}/transactions`, method: 'GET' },
            { name: 'Payouts', url: `${BASE_URL}/payouts?status=pending`, method: 'GET' },
            { name: 'Verification Requests', url: `${BASE_URL}/admin/verifications?status=pending`, method: 'GET' },
            // Moderation? Content?
            { name: 'Admins List', url: `${BASE_URL}/admin/admins`, method: 'GET' }
        ];

        console.log('\nChecking API Endpoints for Frontend Pages:');
        for (const route of routesToCheck) {
            try {
                const res = await axios.get(route.url, { headers });
                console.log(`✅ [${res.status}] ${route.name}`);
            } catch (error) {
                console.log(`❌ [${error.response?.status || 'ERR'}] ${route.name} - ${error.message} (${route.url})`);
            }
        }

    } catch (error) {
        console.error('Fatal Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

verifyAllRoutes();
