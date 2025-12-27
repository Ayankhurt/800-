import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

async function debugJobs() {
    console.log('🔍 Debugging Jobs API Structure...');
    try {
        const login = await axios.post(`${API_BASE_URL}/auth/login`, { email: 'pm@test.com', password: 'ayan1212' });
        const token = login.data.data.token;

        // Check /jobs
        console.log('--- GET /jobs ---');
        const res = await axios.get(`${API_BASE_URL}/jobs`, { headers: { Authorization: `Bearer ${token}` } });

        console.log('Status:', res.status);
        console.log('Data Type:', typeof res.data.data);
        console.log('Is Array?', Array.isArray(res.data.data));
        console.log('Keys in Data:', Object.keys(res.data.data));

        if (!Array.isArray(res.data.data)) {
            console.log('Preview:', JSON.stringify(res.data.data, null, 2));
        } else {
            console.log('First Record:', JSON.stringify(res.data.data[0], null, 2));
        }

    } catch (err) {
        console.log('❌ Error:', err.message);
    }
}

debugJobs();
