// Create test PM user via signup API
import axios from 'axios';

const createTestUser = async () => {
    try {
        console.log('Creating test PM user...\n');

        const signupData = {
            email: 'pm@test.com',
            password: 'Test123!',
            first_name: 'Test',
            last_name: 'PM',
            role: 'project_manager', // Backend expects database enum
            company: 'Test PM Company',
            phone: '+1234567890',
            location: 'New York, NY'
        };

        const response = await axios.post('http://localhost:5000/api/v1/auth/signup', signupData);

        console.log('✓ User created successfully!');
        console.log('User ID:', response.data.data.user.id);
        console.log('Email:', response.data.data.user.email);
        console.log('Token:', response.data.data.token.substring(0, 30) + '...');

    } catch (error) {
        console.error('\n✗ Signup Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
};

createTestUser();
