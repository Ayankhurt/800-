/**
 * Test Project Detail API
 */

import axios from 'axios';

const API_URL = 'http://192.168.2.10:5000/api/v1';
const PROJECT_ID = 'e6992b93-5dc4-4406-8ccc-b245b5a94194';

async function testProjectDetail() {
    try {
        console.log('🧪 Testing Project Detail API\n');

        // 1. Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/admin/login`, {
            email: 'superadmin@bidroom.com',
            password: 'SuperAdmin@123'
        });

        const token = loginResponse.data.data.access_token;
        console.log('✅ Login successful\n');

        // 2. Get project detail
        console.log(`2️⃣ Fetching project: ${PROJECT_ID}`);
        const projectResponse = await axios.get(
            `${API_URL}/admin/projects/${PROJECT_ID}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('✅ Project API Response:');
        console.log(JSON.stringify(projectResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:');
        console.error('   Status:', error.response?.status);
        console.error('   Message:', error.response?.data?.message || error.message);
        console.error('   URL:', error.config?.url);
    }
}

testProjectDetail();
