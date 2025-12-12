import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api/v1';
const TEST_USER = {
    email: 'admin@example.com',
    password: 'password123'
};

let authToken = '';
let createdJobId = '';

const authenticate = async () => {
    try {
        console.log('1. Authenticating...');
        const res = await axios.post(`${API_URL}/auth/login`, TEST_USER);
        authToken = res.data.data.token;
        console.log('   ✅ Authentication successful.');
    } catch (err) {
        console.error('   ❌ Authentication failed:', err.message);
        process.exit(1);
    }
};

const testJobCRUD = async () => {
    console.log('\n2. Testing Job CRUD...');
    const headers = { Authorization: `Bearer ${authToken}` };

    // A. CREATE
    try {
        console.log('   A. Creating Job...');
        const jobData = {
            title: "Test CRUD Job " + Date.now(),
            description: "This is a test job created by the CRUD test script.",
            location: "New York, NY",
            trade_type: "plumbing",
            urgency: "high",
            budget_min: 100,
            budget_max: 500
        };
        const res = await axios.post(`${API_URL}/jobs`, jobData, { headers });
        createdJobId = res.data.data.id; // Assuming response structure
        console.log('      ✅ Job Created. ID:', createdJobId);
    } catch (err) {
        console.error('      ❌ Create Job Failed:', err.response?.data || err.message);
        return; // Stop if create fails
    }

    // B. READ (Get All)
    try {
        console.log('   B. Reading Jobs (List)...');
        const res = await axios.get(`${API_URL}/jobs`, { headers });
        const found = res.data.data.jobs.find(j => j.id === createdJobId);
        if (found) {
            console.log('      ✅ Created Job found in list.');
        } else {
            console.error('      ❌ Created Job NOT found in list.');
        }
    } catch (err) {
        console.error('      ❌ Read Jobs Failed:', err.message);
    }

    // C. READ (Get One)
    try {
        console.log(`   C. Reading Job (ID: ${createdJobId})...`);
        const res = await axios.get(`${API_URL}/jobs/${createdJobId}`, { headers });
        if (res.data.data.id === createdJobId) {
            console.log('      ✅ Fetch Job by ID successful.');
        }
    } catch (err) {
        console.error('      ❌ Read Job by ID Failed:', err.message);
    }

    // D. UPDATE
    try {
        console.log(`   D. Updating Job (ID: ${createdJobId})...`);
        const updateData = { title: "Updated Title " + Date.now() };
        const res = await axios.put(`${API_URL}/jobs/${createdJobId}`, updateData, { headers });
        if (res.data.data.title === updateData.title) {
            console.log('      ✅ Job Updated successfully.');
        } else {
            console.error('      ❌ Job Update mismatch.');
        }
    } catch (err) {
        console.error('      ❌ Update Job Failed:', err.response?.data || err.message);
    }

    // E. DELETE
    try {
        console.log(`   E. Deleting Job (ID: ${createdJobId})...`);
        await axios.delete(`${API_URL}/jobs/${createdJobId}`, { headers });
        console.log('      ✅ Delete Job successful.');
    } catch (err) {
        // If 404, maybe it's already gone? or route doesn't exist?
        console.error('      ❌ Delete Job Failed:', err.response?.status, err.response?.data || err.message);
    }

    // F. VERIFY DELETE
    try {
        console.log('   F. Verifying Deletion...');
        await axios.get(`${API_URL}/jobs/${createdJobId}`, { headers });
        console.error('      ❌ Job still exists after delete!');
    } catch (err) {
        if (err.response?.status === 404) {
            console.log('      ✅ Job correctly returned 404 (Not Found).');
        } else {
            console.error('      ❌ Verification failed with unexpected error:', err.message);
        }
    }
};

const testProfileUpdate = async () => {
    console.log('\n3. Testing Profile Update...');
    const headers = { Authorization: `Bearer ${authToken}` };

    try {
        const updateData = {
            bio: "Updated bio via CRUD test script " + new Date().toISOString()
        };
        const res = await axios.put(`${API_URL}/users/profile`, updateData, { headers });
        if (res.data.data.bio === updateData.bio) {
            console.log('   ✅ Profile updated successfully.');
        } else {
            console.error('   ❌ Profile update mismatch.');
        }
    } catch (err) {
        console.error('   ❌ Profile Update Failed:', err.response?.data || err.message);
    }
};

const run = async () => {
    await authenticate();
    await testJobCRUD();
    await testProfileUpdate();
    console.log('\nDone.');
};

run();
