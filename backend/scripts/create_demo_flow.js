
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
    try {
        console.log('--- STARTING DEMO FLOW ---');

        // 1. Login as PM
        console.log('1. Logging in as PM (pikachugaming899@gmail.com)...');
        const pmLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'pikachugaming899@gmail.com',
            password: 'ayan1212'
        });
        const pmToken = pmLogin.data.data.token;
        const pmId = pmLogin.data.data.user.id;
        console.log('PM Logged in successfully.');

        // 2. Create a Job
        console.log('2. Creating a new Job...');
        const jobRes = await axios.post(`${BASE_URL}/jobs`, {
            title: 'Emergency Plumbing Repair - Demo',
            description: 'Fixing a major leak in the main bathroom. Urgent requirement.',
            trade_type: 'Plumbing',
            location: 'New York, NY',
            budget_min: 500,
            budget_max: 1500,
            urgency: 'high',
            start_date: new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${pmToken}` }
        });
        const jobId = jobRes.data.data.id;
        console.log(`Job created successfully. ID: ${jobId}`);

        // 3. Login as Contractor
        console.log('3. Logging in as Contractor (gc@bidroom.com)...');
        const gcLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'gc@bidroom.com',
            password: 'ayan1212'
        });
        const gcToken = gcLogin.data.data.token;
        const gcId = gcLogin.data.data.user.id;
        console.log('Contractor Logged in successfully.');

        // 4. Apply to Job (Bid)
        console.log('4. Submitting a bid for the job...');
        const bidRes = await axios.post(`${BASE_URL}/jobs/${jobId}/apply`, {
            cover_letter: 'I have 10 years of experience in emergency plumbing. I can start immediately.',
            proposed_rate: 1200,
            available_start_date: new Date().toISOString()
        }, {
            headers: { Authorization: `Bearer ${gcToken}` }
        });
        const bidId = bidRes.data.data.id;
        console.log(`Bid submitted successfully. ID: ${bidId}`);

        // 5. PM accepts the bid (Awarding)
        console.log('5. PM awarding the bid...');
        const awardRes = await axios.put(`${BASE_URL}/bids/${bidId}/status`, {
            status: 'accepted'
        }, {
            headers: { Authorization: `Bearer ${pmToken}` }
        });
        console.log('Job awarded and Project created successfully!');

        console.log('\n--- SUCCESS ---');
        console.log('Flow complete: Job Created -> Bid Submitted -> Project Started');
        console.log(`PM: pikachugaming899@gmail.com`);
        console.log(`Contractor: gc@bidroom.com`);
        console.log(`Project Title: Project for Job #${jobId}`);

    } catch (error) {
        console.error('Error in flow:', error.response ? error.response.data : error.message);
    }
}

run();
