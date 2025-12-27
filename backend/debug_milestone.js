import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

const headers = {
    'Content-Type': 'application/json'
};

async function debugMilestoneError() {
    console.log('🔍 Debugging Milestone API Error...');

    // 1. Login PM
    let token;
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'pm@test.com',
            password: 'ayan1212'
        });
        token = res.data.data.token;
        console.log('✅ Logged in as PM');
    } catch (err) {
        console.error('❌ Login Failed:', err.message);
        return;
    }

    // 2. Get a Project
    let projectId;
    try {
        const res = await axios.get(`${API_BASE_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.data.length > 0) {
            projectId = res.data.data[0].id;
            console.log(`✅ Using Project ID: ${projectId}`);
        } else {
            console.log('❌ No projects found.');
            return;
        }
    } catch (err) {
        console.error('❌ Get Projects Failed:', err.message);
        return;
    }

    // 3. Try Create Milestone
    try {
        console.log('👉 Sending Milestone Request...');
        const data = {
            project_id: projectId,
            title: 'Debug Milestone',
            amount: 5000,
            due_date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };

        const res = await axios.post(`${API_BASE_URL}/milestones`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Milestone Created!', res.data);
    } catch (err) {
        console.error('❌ Milestone Creation Failed!');
        console.error('   Status:', err.response?.status);
        console.error('   Data:', JSON.stringify(err.response?.data, null, 2));
    }
}

debugMilestoneError();
