/**
 * Test Suspend User Functionality
 */

import axios from 'axios';

const API_URL = 'http://192.168.2.10:5000/api/v1';

async function testSuspend() {
    try {
        console.log('🧪 Testing Suspend User Functionality\n');

        // 1. Login as admin
        console.log('1️⃣ Logging in as admin...');
        const loginResponse = await axios.post(`${API_URL}/auth/admin/login`, {
            email: 'superadmin@bidroom.com',
            password: 'admin123'
        });

        const token = loginResponse.data.data.access_token;
        console.log('✅ Login successful\n');

        // 2. Get first user
        console.log('2️⃣ Fetching users...');
        const usersResponse = await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const users = usersResponse.data.data.users || usersResponse.data.data;
        if (!users || users.length === 0) {
            console.log('❌ No users found');
            return;
        }

        const testUser = users[0];
        console.log(`✅ Found user: ${testUser.email} (ID: ${testUser.id})`);
        console.log(`   Current status: is_active=${testUser.is_active}\n`);

        // 3. Suspend user
        console.log('3️⃣ Suspending user...');
        try {
            const suspendResponse = await axios.post(
                `${API_URL}/admin/users/${testUser.id}/suspend`,
                { reason: 'Test suspension' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('✅ Suspend API Response:', JSON.stringify(suspendResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Suspend failed:');
            console.log('   Status:', error.response?.status);
            console.log('   Message:', error.response?.data?.message || error.message);
            console.log('   Full error:', JSON.stringify(error.response?.data, null, 2));
        }

        // 4. Verify suspension
        console.log('\n4️⃣ Verifying suspension...');
        const verifyResponse = await axios.get(`${API_URL}/admin/users/${testUser.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const updatedUser = verifyResponse.data.data;
        console.log(`   is_active: ${updatedUser.is_active}`);
        console.log(`   status: ${updatedUser.status || 'N/A'}`);

        if (updatedUser.is_active === false) {
            console.log('✅ User successfully suspended!');
        } else {
            console.log('❌ User suspension failed - is_active is still true');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testSuspend();
