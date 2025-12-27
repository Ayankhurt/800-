import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

async function strictValidate() {
    console.log('🛡️  STRICT DEEP SCAN INITIATED...');
    console.log('='.repeat(60));

    let issues = 0;
    function fail(msg) {
        console.log(`❌ ${msg}`);
        issues++;
    }

    try {
        // Login PM
        const login = await axios.post(`${API_BASE_URL}/auth/login`, { email: 'pm@test.com', password: 'ayan1212' });
        const token = login.data.data.token;

        // 1. DEEP SCAN PROJECTS
        console.log('\n--- Scanning Projects (Relations & Enums) ---');
        const pRes = await axios.get(`${API_BASE_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });
        let projects = pRes.data.data.projects || pRes.data.data;
        if (!Array.isArray(projects)) projects = [];

        projects.forEach(p => {
            // Owner Check
            if (!p.owner && !p.owner_id) fail(`Project ${p.id}: Missing Owner Info`);
            if (p.owner && !p.owner.first_name) fail(`Project ${p.id}: Owner object incomplete (missing name)`);

            // Status Enum Check
            const validStatuses = ['active', 'completed', 'pending', 'setup', 'cancelled', 'archived'];
            if (!validStatuses.includes(p.status)) fail(`Project ${p.id}: Invalid Status '${p.status}'`);

            // Contractor Check (if assigned)
            if (p.contractor && !p.contractor.first_name) fail(`Project ${p.id}: Contractor object incomplete`);
        });

        // 2. DEEP SCAN JOBS
        console.log('\n--- Scanning Jobs (Relations & Enums) ---');
        const jRes = await axios.get(`${API_BASE_URL}/jobs`, { headers: { Authorization: `Bearer ${token}` } });
        let jobs = [];
        if (Array.isArray(jRes.data.data)) jobs = jRes.data.data;
        else if (jRes.data.data && Array.isArray(jRes.data.data.jobs)) jobs = jRes.data.data.jobs;

        for (const j of jobs) {
            // Project Manager Check
            // The API returns 'project_manager' object via join
            if (!j.project_manager) fail(`Job ${j.id}: Missing Project Manager Object`);
            else if (!j.project_manager.first_name && !j.project_manager.email) fail(`Job ${j.id}: PM Object Empty`);

            // Status Check
            if (j.status !== 'open' && j.status !== 'closed' && j.status !== 'draft') fail(`Job ${j.id}: Invalid Status '${j.status}'`);

            // Applications Integrity (fetch applications for this job)
            // Only if count > 0 to save time, or check a few
            if (j.application_count > 0) {
                try {
                    const appRes = await axios.get(`${API_BASE_URL}/jobs/${j.id}/applications`, { headers: { Authorization: `Bearer ${token}` } });
                    const apps = appRes.data.data;
                    if (Array.isArray(apps)) {
                        apps.forEach(a => {
                            if (!a.contractor) fail(`Job ${j.id} App ${a.id}: Missing Contractor Object`);
                            if (a.status === undefined) fail(`Job ${j.id} App ${a.id}: Missing Status`);
                        });
                    }
                } catch (e) {
                    // Ignore 403 (if not owner), but PM should own these jobs
                    if (e.response?.status !== 403) fail(`Job ${j.id}: Failed to fetch applications: ${e.message}`);
                }
            }
        }

        // 3. DEEP SCAN BIDS (Login as GC)
        console.log('\n--- Scanning Bids (Relations) ---');
        const gcLogin = await axios.post(`${API_BASE_URL}/auth/login`, { email: 'cont@bidroom.com', password: 'ayan1212' });
        const gcToken = gcLogin.data.data.token;

        const bRes = await axios.get(`${API_BASE_URL}/bids/my-bids`, { headers: { Authorization: `Bearer ${gcToken}` } });
        const bids = bRes.data.data || [];

        bids.forEach(b => {
            if (!b.job_id) fail(`Bid ${b.id}: Missing Job ID`);
            // Check if job details are joined (usually required for UI cards)
            if (!b.job) fail(`Bid ${b.id}: Missing Job Object (Join failed)`);
            else if (!b.job.title) fail(`Bid ${b.id}: Job Object incomplete`);

            if (!b.contractor && !b.contractor_id) fail(`Bid ${b.id}: Missing Contractor Info`);
        });

    } catch (err) {
        fail(`Validation Script Crashed: ${err.message}`);
        if (err.response) console.log(JSON.stringify(err.response.data));
    }

    console.log('\n' + '='.repeat(60));
    if (issues === 0) {
        console.log('✅ STRICT SCAN PASSED! All relations and enums are valid.');
    } else {
        console.log(`⚠️  FAILED! Found ${issues} critical data integrity issues.`);
    }
}

strictValidate();
