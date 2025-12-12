import http from 'http';

const data = JSON.stringify({
    email: 'admin@bidroom.com',
    password: 'Password123!'
});

const options = {
    hostname: 'localhost',
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
        console.log('Status Code:', res.statusCode);
        console.log('Response:', responseData);
        try {
            const parsed = JSON.parse(responseData);
            console.log('Parsed:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Could not parse response');
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
