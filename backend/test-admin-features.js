import http from 'http';

async function testAdminFeatures(email, password, roleName) {
    // First login
    const loginData = JSON.stringify({ email, password });

    return new Promise((resolve, reject) => {
        const loginReq = http.request({
            hostname: '192.168.0.107',
            port: 5000,
            path: '/api/v1/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const parsed = JSON.parse(data);
                    if (!parsed.success) {
                        resolve({ role: roleName, error: 'Login failed' });
                        return;
                    }

                    const token = parsed.data.access_token;

                    // Test various endpoints
                    const endpoints = [
                        { name: 'Dashboard Stats', path: '/api/v1/admin/dashboard-stats' },
                        { name: 'List Users', path: '/api/v1/admin/users?page=1&limit=10' },
                        { name: 'List Projects', path: '/api/v1/admin/projects?page=1&limit=10' },
                        { name: 'List Jobs', path: '/api/v1/admin/jobs?page=1&limit=10' },
                        { name: 'Financial Stats', path: '/api/v1/admin/financial-stats' },
                        { name: 'Get Notifications', path: '/api/v1/notifications?limit=10' }
                    ];

                    const results = [];

                    for (const endpoint of endpoints) {
                        const testResult = await testEndpoint(endpoint.path, token);
                        results.push({
                            name: endpoint.name,
                            status: testResult.status,
                            success: testResult.status === 200
                        });
                    }

                    resolve({
                        role: roleName,
                        email,
                        loginSuccess: true,
                        features: results
                    });

                } catch (e) {
                    resolve({ role: roleName, error: 'Parse error' });
                }
            });
        });

        loginReq.on('error', err => reject(err));
        loginReq.write(loginData);
        loginReq.end();
    });
}

function testEndpoint(path, token) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: '192.168.0.107',
            port: 5000,
            path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', () => resolve({ status: 0 }));
        req.end();
    });
}

async function runFullTest() {
    console.log('🔍 Testing Admin Panel Features for All Roles\n');
    console.log('='.repeat(100));

    const roles = [
        { email: 'super@bidroom.com', password: 'Password123!', name: 'Super Admin' },
        { email: 'admin@bidroom.com', password: 'Password123!', name: 'Admin' },
        { email: 'finance@bidroom.com', password: 'Password123!', name: 'Finance Manager' }
    ];

    for (const role of roles) {
        console.log(`\n📋 Testing: ${role.name} (${role.email})`);
        console.log('-'.repeat(100));

        const result = await testAdminFeatures(role.email, role.password, role.name);

        if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            continue;
        }

        console.log(`✅ Login: Success`);
        console.log(`\nFeature Access:`);

        result.features.forEach(feature => {
            const icon = feature.success ? '✅' : '❌';
            const status = feature.status === 200 ? 'OK' : `${feature.status}`;
            console.log(`  ${icon} ${feature.name.padEnd(25)} | Status: ${status}`);
        });
    }

    console.log('\n' + '='.repeat(100));
    console.log('✨ Full Test Complete!\n');
}

runFullTest();
