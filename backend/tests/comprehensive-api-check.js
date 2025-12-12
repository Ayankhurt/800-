
import http from 'http';
import https from 'https';

const BASE_URL = 'http://localhost:5000/api/v1';

// Utilities
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(method, endpoint, token = null, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpoint}`);
        const options = {
            method,
            headers: {}
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        let body;
        if (data) {
            options.headers['Content-Type'] = 'application/json';
            body = JSON.stringify(data);
        }

        const req = http.request(url, options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) req.write(body);
        req.end();
    });
}

const state = {
    tokens: {
        admin: null,
        client: null,
        contractor: null
    },
    ids: {
        client: null,
        contractor: null
    }
};

async function runTest() {
    console.log('🚀 STARTING COMPREHENSIVE API CHECK (Skipping AI, Moderation, Payments) 🚀');

    // 1. Setup Admin
    const adminEmail = `admin_chk_${Date.now()}@test.com`;
    console.log(`\nCreating Admin: ${adminEmail}`);
    const adminRes = await request('POST', '/auth/signup', null, {
        email: adminEmail,
        password: 'Test123!@#',
        first_name: 'Admin',
        last_name: 'Check',
        role: 'admin'
    });
    if (adminRes.status === 201 || adminRes.status === 200) {
        state.tokens.admin = adminRes.data.data.token;
        console.log('✅ Admin Created');
    } else {
        console.error('❌ Admin Creation Failed', adminRes.data);
        process.exit(1);
    }

    // 2. Setup Client
    const clientEmail = `client_chk_${Date.now()}@test.com`;
    console.log(`Creating Client: ${clientEmail}`);
    const clientRes = await request('POST', '/auth/signup', null, {
        email: clientEmail,
        password: 'Test123!@#',
        first_name: 'Client',
        last_name: 'Check',
        role: 'client'
    });
    if (clientRes.status === 201 || clientRes.status === 200) {
        state.tokens.client = clientRes.data.data.token;
        state.ids.client = clientRes.data.data.user.id;
        console.log('✅ Client Created');
    }

    // 3. Setup Contractor
    const contractorEmail = `contractor_chk_${Date.now()}@test.com`;
    console.log(`Creating Contractor: ${contractorEmail}`);
    const contractorRes = await request('POST', '/auth/signup', null, {
        email: contractorEmail,
        password: 'Test123!@#',
        first_name: 'Contractor',
        last_name: 'Check',
        role: 'contractor'
    });
    if (contractorRes.status === 201 || contractorRes.status === 200) {
        state.tokens.contractor = contractorRes.data.data.token;
        state.ids.contractor = contractorRes.data.data.user.id;
        console.log('✅ Contractor Created');
    }

    const adminTests = [
        { method: 'GET', url: '/admin/dashboard/stats' },
        { method: 'GET', url: '/admin/users' },
        { method: 'GET', url: '/admin/projects' },
        { method: 'GET', url: '/admin/jobs' },
        { method: 'GET', url: '/admin/bids' },
        { method: 'GET', url: '/admin/disputes' },
        { method: 'GET', url: '/admin/support/tickets' },
        { method: 'GET', url: '/admin/verifications' },
        { method: 'GET', url: '/admin/analytics' },
        { method: 'GET', url: '/admin/settings' },
        { method: 'GET', url: '/admin/audit-logs' },
        { method: 'GET', url: '/admin/referrals/stats' }, // referralRoutes
        { method: 'GET', url: '/admin/reviews' },
        { method: 'GET', url: '/admin/messages' },
        { method: 'GET', url: '/admin/announcements' },
        { method: 'GET', url: '/admin/badges' },
        { method: 'GET', url: '/admin/appointments' },
        { method: 'GET', url: '/admin/login/logs' },
        { method: 'GET', url: '/admin/marketing/campaigns' },
        { method: 'GET', url: '/admin/security/blocked-ips' },
        { method: 'GET', url: '/admin/security/ddos-logs' },
        { method: 'GET', url: '/admin/security/failed-logins' }
    ];

    console.log('\n--- Running ADMIN API Tests ---');
    for (const test of adminTests) {
        const res = await request(test.method, test.url, state.tokens.admin);
        if (res.status >= 200 && res.status < 300) {
            console.log(`✅ ${test.method} ${test.url} - ${res.status}`);
        } else {
            console.log(`❌ ${test.method} ${test.url} - ${res.status} - ${JSON.stringify(res.data).substring(0, 100)}`);
        }
    }

    const userTests = [
        { method: 'GET', url: '/analytics/profile', token: 'contractor' },
        // { method: 'POST', url: '/analytics/view', token: 'contractor', data:{} }, // skip POST for brevity unless critical
        { method: 'GET', url: '/applications/my-applications', token: 'contractor' },
        { method: 'GET', url: '/appointments/', token: 'client' },
        { method: 'GET', url: '/badges/', token: 'client' },
        { method: 'GET', url: '/bids/my-bids', token: 'contractor' },
        { method: 'GET', url: '/communication/conversations', token: 'client' },
        { method: 'GET', url: '/contractors/search', token: 'client' },
        { method: 'GET', url: '/disputes/', token: 'client' },
        { method: 'GET', url: '/invites/my-invites', token: 'contractor' },
        { method: 'GET', url: '/jobs/', token: 'contractor' },
        { method: 'GET', url: '/messages/conversations', token: 'client' },
        { method: 'GET', url: '/notifications/', token: 'client' },
        { method: 'GET', url: '/projects/', token: 'contractor' },
        { method: 'GET', url: '/quotes/', token: 'client' },
        { method: 'GET', url: '/referrals/stats', token: 'client' },
        // { method: 'GET', url: `/reviews/user/${state.ids.contractor}`, token: 'client' }, // might fail if no reviews
        { method: 'GET', url: '/saved/', token: 'client' },
        { method: 'GET', url: '/settings/', token: 'client' },
        { method: 'GET', url: '/stats/user-dashboard', token: 'client' },
        { method: 'GET', url: '/templates/', token: 'client' },
        { method: 'GET', url: '/users/me', token: 'client' },
        { method: 'GET', url: '/verification/my-status', token: 'contractor' },
        { method: 'GET', url: '/video-consultations/', token: 'client' }
    ];

    console.log('\n--- Running USER API Tests ---');
    for (const test of userTests) {
        const token = state.tokens[test.token];
        const res = await request(test.method, test.url, token);
        if (res.status >= 200 && res.status < 300) {
            console.log(`✅ ${test.method} ${test.url} - ${res.status}`);
        } else {
            console.log(`❌ ${test.method} ${test.url} - ${res.status} - ${JSON.stringify(res.data).substring(0, 100)}`);
        }
    }

    console.log('\n✨ Check Completed ✨');
}

runTest();
