
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api/v1';
const ADMIN_CREDENTIALS = { email: 'admin@example.com', password: 'password123' };

// Map of modules to test
const modules = [
    { name: 'Analytics', method: 'GET', url: '/analytics/profile' }, // Need user context
    { name: 'Applications', method: 'GET', url: '/applications/my-applications' },
    { name: 'Appointments', method: 'GET', url: '/appointments' },
    { name: 'Auth', method: 'POST', url: '/auth/login', body: ADMIN_CREDENTIALS },
    { name: 'Badges', method: 'GET', url: '/badges' },
    { name: 'Communication', method: 'GET', url: '/communication/conversations' },
    { name: 'Contractors', method: 'GET', url: '/contractors/search' },
    { name: 'Disputes', method: 'GET', url: '/disputes' },
    // { name: 'Endorsements',      method: 'GET', url: '/endorsements' }, // Needs param
    { name: 'Extended Admin', method: 'GET', url: '/admin/ai/contracts' },
    { name: 'Finance', method: 'GET', url: '/finance/transactions' },
    { name: 'Invites', method: 'GET', url: '/invites/my-invites' },
    { name: 'Jobs', method: 'GET', url: '/jobs' },
    { name: 'Notifications', method: 'GET', url: '/notifications' },
    // { name: 'Projects',          method: 'GET', url: '/projects' }, // Needs ID or logic, skipping generic GET /
    { name: 'Quotes', method: 'GET', url: '/quotes' },
    { name: 'Referrals', method: 'GET', url: '/referrals/stats' },
    { name: 'Reports', method: 'GET', url: '/reports' },
    // { name: 'Reviews',           method: 'GET', url: '/reviews' }, // Needs param
    { name: 'Saved', method: 'GET', url: '/saved' },
    { name: 'Settings', method: 'GET', url: '/settings' },
    { name: 'Stats (User)', method: 'GET', url: '/stats/user-dashboard' },
    { name: 'Stats (Admin)', method: 'GET', url: '/stats/admin-dashboard' },
    { name: 'Templates', method: 'GET', url: '/templates' },
    // { name: 'Users',             method: 'GET', url: '/users' }, // Admin only
    { name: 'Verification', method: 'GET', url: '/verification/my-status' },
    { name: 'Video Consultations', method: 'GET', url: '/video-consultations' }
];

const run = async () => {
    console.log("🚀 Testing All API Modules...");

    let authToken = '';

    // Authenticate
    try {
        const res = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
        authToken = res.data.data.token;
        console.log("✅ Auth: Login Successful");
    } catch (err) {
        console.error("❌ Auth Failed:", err.message);
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    for (const mod of modules) {
        if (mod.name === 'Auth') continue; // Already tested

        try {
            if (mod.method === 'GET') {
                await axios.get(`${API_URL}${mod.url}`, { headers });
            } else if (mod.method === 'POST') {
                await axios.post(`${API_URL}${mod.url}`, mod.body || {}, { headers });
            }
            console.log(`✅ ${mod.name}: OK (${mod.url})`);
        } catch (err) {
            const status = err.response ? err.response.status : 'No Response';
            const msg = err.response?.data?.message || err.message;
            // 404 is bad (route missing). 500 is bad (crash). 
            // 200, 201, 400 (Bad Request - expected if params missing), 403 (Forbidden - permission) are "Connected".
            // We flag ONLY 404 or 500 as Failures for "Connectivity Check".
            if (status === 404) {
                console.error(`❌ ${mod.name}: 404 Not Found (${mod.url})`);
            } else if (status === 500) {
                console.error(`❌ ${mod.name}: 500 Server Error (${mod.url}) - ${msg}`);
            } else {
                console.log(`⚠️ ${mod.name}: Connected but returned ${status} (${msg}) - OK`);
            }
        }
    }
    console.log("✨ Done.");
};

run();
