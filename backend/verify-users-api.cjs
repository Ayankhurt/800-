const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../rork-10_25_bidroom/.env' });

// Configuration
const API_URL = 'http://192.168.2.10:5000/api/v1';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

console.log('Testing Admin Users List API...');

async function testListUsers() {
    try {
        // 1. First login to get token
        console.log('Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'super@bidroom.com',
            password: 'Password123!'
        });

        const token = loginRes.data.data.token;
        console.log('Login successful. Token received.');

        // 2. Call list users
        console.log('Fetching users list...');
        const response = await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            console.log('Users list retrieved successfully.');
            const users = response.data.data.users;
            console.log(`Total users: ${response.data.data.total}`);

            if (users.length > 0) {
                const firstUser = users[0];
                console.log('DATA STRUCTURE CHECK (First User):');
                console.log(JSON.stringify(firstUser, null, 2));

                // Specific checks
                console.log('--------------------------------');
                console.log('Checking "role" field:', firstUser.role);
                console.log('Checking "role_code" field:', firstUser.role_code);
                console.log('Checking "full_name" field:', firstUser.full_name);
            } else {
                console.log('No users found.');
            }
        } else {
            console.log('Failed to list users:', response.data.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testListUsers();
