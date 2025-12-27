import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

async function resetAllPasswords() {
    console.log('\n🔧 Resetting All User Passwords via Backend API\n');
    console.log('='.repeat(70));

    // First, login as admin to get token
    console.log('\n1️⃣ Logging in as admin...');

    let adminToken = null;
    try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@bidroom.com',
            password: 'ayan1212'
        });

        if (loginResponse.data.success && loginResponse.data.data.token) {
            adminToken = loginResponse.data.data.token;
            console.log('✅ Admin login successful!');
        }
    } catch (err) {
        console.log('⚠️  Admin login failed, trying with old password or creating new admin...');
    }

    // List of all users to update
    const users = [
        { email: 'admin@bidroom.com', name: 'Admin User', role: 'admin' },
        { email: 'super@bidroom.com', name: 'Super Admin', role: 'super_admin' },
        { email: 'mod@bidroom.com', name: 'Moderator', role: 'moderator' },
        { email: 'support@bidroom.com', name: 'Support Agent', role: 'support_agent' },
        { email: 'finance@bidroom.com', name: 'Finance Manager', role: 'finance_manager' },
        { email: 'pm@test.com', name: 'Test PM', role: 'project_manager' },
        { email: 'cont@bidroom.com', name: 'contractor doe', role: 'general_contractor' },
        { email: 'sub@bidroom.com', name: 'Ayan sub', role: 'subcontractor' },
        { email: 'ts@test.com', name: 'Trade Specialist', role: 'trade_specialist' },
    ];

    console.log(`\n2️⃣ Testing login for ${users.length} users with password: ayan1212\n`);

    const results = {
        success: [],
        failed: [],
    };

    for (const user of users) {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: user.email,
                password: 'ayan1212'
            });

            if (response.data.success) {
                console.log(`✅ ${user.email} - Login successful`);
                results.success.push(user.email);
            } else {
                console.log(`❌ ${user.email} - Login failed: ${response.data.message}`);
                results.failed.push(user.email);
            }
        } catch (err) {
            console.log(`❌ ${user.email} - Login failed: ${err.response?.data?.message || err.message}`);
            results.failed.push(user.email);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESULTS:');
    console.log(`   ✅ Successful logins: ${results.success.length}`);
    console.log(`   ❌ Failed logins: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Failed users:');
        results.failed.forEach(email => console.log(`   - ${email}`));

        console.log('\n💡 These users need password reset. Options:');
        console.log('   1. Run SQL in Supabase Dashboard (see UPDATE_PASSWORDS.sql)');
        console.log('   2. Use Supabase Auth Dashboard to reset passwords');
        console.log('   3. Delete and recreate users via signup endpoint');
    }

    console.log('\n');
}

resetAllPasswords();
