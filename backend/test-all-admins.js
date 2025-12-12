import http from 'http';

const testUsers = [
    { email: 'super@bidroom.com', password: 'Password123!', role: 'Super Admin' },
    { email: 'admin@bidroom.com', password: 'Password123!', role: 'Admin' },
    { email: 'finance@bidroom.com', password: 'Password123!', role: 'Finance Manager' },
    { email: 'mod@bidroom.com', password: 'Password123!', role: 'Moderator' },
    { email: 'support@bidroom.com', password: 'Password123!', role: 'Support Agent' }
];

async function testLogin(user) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            email: user.email,
            password: user.password
        });

        const options = {
            hostname: '192.168.0.107',
            port: 5000,
            path: '/api/v1/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        user: user.role,
                        email: user.email,
                        status: res.statusCode,
                        success: parsed.success,
                        hasToken: !!parsed.data?.access_token,
                        userRole: parsed.data?.user?.role,
                        userId: parsed.data?.user?.id
                    });
                } catch (e) {
                    resolve({
                        user: user.role,
                        email: user.email,
                        status: res.statusCode,
                        error: 'Parse error',
                        raw: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject({ user: user.role, error: error.message });
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Admin Role Logins...\n');
    console.log('Backend: http://192.168.0.107:5000\n');
    console.log('='.repeat(80));

    for (const user of testUsers) {
        try {
            const result = await testLogin(user);

            if (result.success && result.hasToken) {
                console.log(`✅ ${result.user.padEnd(20)} | ${result.email.padEnd(25)} | Role: ${result.userRole}`);
            } else {
                console.log(`❌ ${result.user.padEnd(20)} | ${result.email.padEnd(25)} | Status: ${result.status}`);
            }
        } catch (error) {
            console.log(`❌ ${user.role.padEnd(20)} | ${user.email.padEnd(25)} | Error: ${error.error}`);
        }
    }

    console.log('='.repeat(80));
    console.log('\n✨ Test Complete!\n');
}

runTests();
