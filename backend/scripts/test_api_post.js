import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testApiPost() {
    const url = 'http://localhost:5000/api/v1/messages';

    // We need a valid token. Since we don't have one easily, 
    // we can temporarily disable auth in messageRoutes.js for testing
    // OR just see that it 401s (not 500).

    console.log(`Testing POST to ${url} with NO token...`);
    try {
        const response = await axios.post(url, {
            conversationId: '96b49a6f-69bf-4dfe-93c7-ac87321336bb',
            message: 'Integration test'
        });
        console.log("Response:", response.data);
    } catch (error) {
        if (error.response) {
            console.log("Error status:", error.response.status);
            console.log("Error data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testApiPost();
