// Test Admin Login
const testLogin = async () => {
    try {
        console.log('Testing admin login...');

        const response = await fetch('http://localhost:5000/api/v1/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'superadmin@bidroom.com',
                password: 'ayan1212'
            })
        });

        const data = await response.json();

        console.log('\n=== LOGIN RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Success:', data.success);
        console.log('Message:', data.message);

        if (data.success) {
            console.log('\n✅ LOGIN SUCCESSFUL!');
            console.log('Token:', data.data.token ? 'Generated ✓' : 'Missing ✗');
            console.log('User:', data.data.user ? 'Present ✓' : 'Missing ✗');
            console.log('User Role:', data.data.user?.role);
            console.log('User Email:', data.data.user?.email);
        } else {
            console.log('\n❌ LOGIN FAILED!');
            console.log('Error:', data.message);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
};

testLogin();
