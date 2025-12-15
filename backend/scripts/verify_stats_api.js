
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function verifyStatsEndpoint() {
    try {
        console.log('Logging in as support@bidroom.com...');
        // We need the password. I saw it in the logs output earlier:
        // password_hash matches specific hash. The seed data usually uses 'password123' or 'admin123'. 
        // Let's try 'password123'.
        let loginRes;
        try {
            loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'support@bidroom.com',
                password: 'password123'
            });
        } catch (e) {
            // Try admin123 if password123 fails
            console.log('Login failed with password123, trying admin123...');
            loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'support@bidroom.com',
                password: 'admin123'
            });
        }

        const token = loginRes.data.data.token; // Check structure if fails
        console.log('Login successful. Token:', token.substring(0, 20) + '...');

        console.log('Fetching Admin Dashboard Stats...');
        const statsRes = await axios.get(`${API_URL}/stats/admin-dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Stats Response Status:', statsRes.status);
        console.log('Stats Data:', JSON.stringify(statsRes.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

verifyStatsEndpoint();
