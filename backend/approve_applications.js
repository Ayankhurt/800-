import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

async function approveApplications() {
    console.log('🤝 Approving Pending Applications...\n');

    // 1. Login PM
    let pmToken;
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'pm@test.com',
            password: 'ayan1212'
        });
        pmToken = res.data.data.token;
        console.log('✅ PM Logged In');
    } catch (err) {
        console.error('❌ PM Login Failed', err.message);
        return;
    }

    // 2. Get PM's Jobs
    let jobIds = [];
    try {
        const res = await axios.get(`${API_BASE_URL}/jobs/my-jobs`, {
            headers: { Authorization: `Bearer ${pmToken}` }
        });
        // Assuming endpoint returns list of jobs
        // Wait, need to check if /jobs/my-jobs exists or just /jobs with filters
        // Using filtered /jobs endpoint as fallback
        const res2 = await axios.get(`${API_BASE_URL}/jobs?project_manager_id=me`, {
            headers: { Authorization: `Bearer ${pmToken}` }
        });

        // Combine IDs just in case
        const jobs = res2.data.data || [];
        jobIds = jobs.map(j => j.id);
        console.log(`✅ Found ${jobIds.length} Jobs owned by PM`);

    } catch (err) {
        // try fetching all jobs if specific endpoint fails
        try {
            const res = await axios.get(`${API_BASE_URL}/jobs`, {
                headers: { Authorization: `Bearer ${pmToken}` }
            });
            jobIds = res.data.data.map(j => j.id);
            console.log(`✅ Found ${jobIds.length} Total Jobs`);
        } catch (e) {
            console.error('❌ Get Jobs Failed', e.message);
            return;
        }
    }

    // 3. Find and Approve Applications
    let approvedCount = 0;
    for (const jobId of jobIds) {
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/job/${jobId}`, {
                headers: { Authorization: `Bearer ${pmToken}` }
            });

            const applications = res.data.data;
            if (applications && applications.length > 0) {
                console.log(`   Found ${applications.length} applications for Job ${jobId}`);

                for (const app of applications) {
                    if (app.status === 'pending') {
                        try {
                            await axios.put(`${API_BASE_URL}/applications/${app.id}/status`, {
                                status: 'accepted'
                            }, { headers: { Authorization: `Bearer ${pmToken}` } });
                            console.log(`   ✅ Approved application ${app.id}`);
                            approvedCount++;
                        } catch (err) {
                            console.error(`   ❌ Approve Failed for ${app.id}:`, err.message);
                        }
                    }
                }
            }
        } catch (err) {
            if (err.response?.status !== 404 && err.response?.status !== 403) {
                console.log(`   Error checking applications for job ${jobId}: ${err.message}`);
            }
        }
    }

    console.log('\n' + '='.repeat(50));
    if (approvedCount > 0) {
        console.log(`✅ successfully Approved ${approvedCount} Applications!`);
        console.log('   Subcontractors and Trades now have active approved work.');
    } else {
        console.log('ℹ️  No pending applications found to approve.');
    }
}

approveApplications();
