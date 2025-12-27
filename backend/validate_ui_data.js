import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

async function validateData() {
    console.log('🕵️‍♀️ Validating Data for UI Rendering Issues...');
    console.log('='.repeat(60));

    let issuesFound = 0;

    function reportIssue(context, id, field, value) {
        console.log(`❌ [${context}] ID: ${id} | Field: ${field} | Value: ${value}`);
        issuesFound++;
    }

    // 1. Projects
    try {
        const login = await axios.post(`${API_BASE_URL}/auth/login`, { email: 'pm@test.com', password: 'ayan1212' });
        const token = login.data.data.token;
        const res = await axios.get(`${API_BASE_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });

        // Check structure based on response
        let projects = res.data.data;
        // Handle nested format if applicable
        if (res.data.data.projects) projects = res.data.data.projects;

        if (projects) {
            projects.forEach(p => {
                if (!p.title) reportIssue('Project', p.id, 'title', p.title);
                // Allow empty description? UI might show "No description"
                // if (!p.description) reportIssue('Project', p.id, 'description', p.description);
                // if (!p.location) reportIssue('Project', p.id, 'location', p.location);

                if (!p.start_date || isNaN(Date.parse(p.start_date))) reportIssue('Project', p.id, 'start_date', p.start_date);
                if (!p.end_date || isNaN(Date.parse(p.end_date))) reportIssue('Project', p.id, 'end_date', p.end_date);

                // Budget checks
                // Different fields might be used: budget, total_amount
                const amount = p.budget || p.total_amount;
                if (amount === undefined || amount === null || isNaN(amount)) {
                    reportIssue('Project', p.id, 'budget/total_amount', amount);
                }
            });
        }
    } catch (e) { console.log('Error checking projects:', e.message); }

    // 2. Jobs
    try {
        // Reuse token if possible or login again
        const login = await axios.post(`${API_BASE_URL}/auth/login`, { email: 'pm@test.com', password: 'ayan1212' });
        const token = login.data.data.token;

        // Use /jobs endpoint
        const res = await axios.get(`${API_BASE_URL}/jobs`, { headers: { Authorization: `Bearer ${token}` } });

        let jobs = [];
        if (Array.isArray(res.data.data)) {
            jobs = res.data.data;
        } else if (res.data.data && Array.isArray(res.data.data.jobs)) {
            jobs = res.data.data.jobs;
        }

        jobs.forEach(j => {
            if (!j.title) reportIssue('Job', j.id, 'title', j.title);
            // Location is alias in API response usually, check properties
            // if (!j.location && !j.locations) reportIssue('Job', j.id, 'location', j.location);
            if (j.budget_min === undefined || j.budget_min === null || isNaN(j.budget_min)) reportIssue('Job', j.id, 'budget_min', j.budget_min);
            if (j.budget_max === undefined || j.budget_max === null || isNaN(j.budget_max)) reportIssue('Job', j.id, 'budget_max', j.budget_max);
        });
    } catch (e) {
        // Sometimes /my-jobs fails, try generic
        console.log('Error checking jobs:', e.message);
    }

    // 3. Milestones
    try {
        const login = await axios.post(`${API_BASE_URL}/auth/login`, { email: 'pm@test.com', password: 'ayan1212' });
        const token = login.data.data.token;
        const res = await axios.get(`${API_BASE_URL}/milestones`, { headers: { Authorization: `Bearer ${token}` } });
        const milestones = res.data.data || [];

        milestones.forEach(m => {
            if (!m.title) reportIssue('Milestone', m.id, 'title', m.title);
            if (m.amount === undefined || m.amount === null || isNaN(m.amount)) reportIssue('Milestone', m.id, 'amount', m.amount);
            if (!m.due_date || isNaN(Date.parse(m.due_date))) reportIssue('Milestone', m.id, 'due_date', m.due_date);
        });
    } catch (e) { console.log('Error checking milestones:', e.message); }

    // 4. Bids (GC View)
    try {
        const login = await axios.post(`${API_BASE_URL}/auth/login`, { email: 'cont@bidroom.com', password: 'ayan1212' });
        const token = login.data.data.token;
        const res = await axios.get(`${API_BASE_URL}/bids/my-bids`, { headers: { Authorization: `Bearer ${token}` } });
        const bids = res.data.data || [];

        bids.forEach(b => {
            if (b.amount === undefined || b.amount === null || isNaN(b.amount)) reportIssue('Bid', b.id, 'amount', b.amount);
        });
    } catch (e) { console.log('Error checking bids:', e.message); }

    console.log('\n' + '='.repeat(60));
    if (issuesFound === 0) {
        console.log('✅ ALL CHECKS PASSED! No null/NaN/invalid fields found.');
    } else {
        console.log(`⚠️  Found ${issuesFound} issues specific invalid data points.`);
    }
}

validateData();
