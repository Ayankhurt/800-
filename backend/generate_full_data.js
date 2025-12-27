import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

// Users
const users = {
    admin: { email: 'admin@bidroom.com', password: 'ayan1212' },
    pm: { email: 'pm@test.com', password: 'ayan1212' },
    gc: { email: 'cont@bidroom.com', password: 'ayan1212' },
    sub: { email: 'sub@bidroom.com', password: 'ayan1212' },
    trade: { email: 'trade@bidroom.com', password: 'ayan1212' },
    finance: { email: 'finance@bidroom.com', password: 'ayan1212' },
};

let tokens = {};

async function loginUser(role) {
    try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, users[role]);
        if (res.data.success) {
            tokens[role] = res.data.data.token;
            console.log(`✅ ${role.toUpperCase()} Logged In`);
        }
    } catch (err) {
        console.log(`❌ ${role.toUpperCase()} Login Failed: ${err.message}`);
    }
}

async function generateData() {
    console.log('\n🚀 Generating Data for All Roles...\n');
    console.log('='.repeat(50));

    // 1. Login everyone
    for (const role of Object.keys(users)) {
        await loginUser(role);
    }

    if (!tokens.pm || !tokens.gc) {
        console.log('\n❌ Critical: PM or GC login failed. Aborting data generation.');
        return;
    }

    // 2. PM Creates Jobs
    console.log('\n📋 Creating Jobs (PM)...');
    const jobIds = [];
    for (let i = 1; i <= 3; i++) {
        try {
            const res = await axios.post(`${API_BASE_URL}/jobs`, {
                title: `Luxury Villa Construction Phase ${i}`,
                description: `Complete construction project for luxury villa phase ${i}. Requires high-quality finishing and attention to detail.`,
                location: 'Dubai, UAE',
                budget: 150000 * i,
                timeline: `${i * 3} months`,
                required_skills: ['General Construction', 'Finishing', 'Luxury Design'],
                job_type: 'contract',
                experience_level: 'expert'
            }, { headers: { Authorization: `Bearer ${tokens.pm}` } });

            if (res.data.success) {
                jobIds.push(res.data.data.id);
                console.log(`   ✅ Job ${i} Created: ${res.data.data.title}`);
            }
        } catch (err) {
            console.log(`   ❌ Job ${i} Failed: ${err.message}`);
        }
    }

    // 3. GC Submits Bids
    console.log('\n💰 Submitting Bids (GC)...');
    for (const jobId of jobIds) {
        try {
            await axios.post(`${API_BASE_URL}/bids`, {
                job_id: jobId,
                title: 'Premium Construction Bid',
                description: 'We offer the best quality construction with a team of 50+ experienced workers.',
                amount: 145000,
                timeline: '3 months',
                proposal: 'Detailed proposal attached...',
                milestones: [
                    { title: 'Foundation', amount: 40000, duration: '1 month' },
                    { title: 'Structure', amount: 60000, duration: '1 month' },
                    { title: 'Finishing', amount: 45000, duration: '1 month' }
                ]
            }, { headers: { Authorization: `Bearer ${tokens.gc}` } });
            console.log(`   ✅ Bid Submitted for Job ID: ${jobId}`);
        } catch (err) {
            console.log(`   ❌ Bid Failed: ${err.message}`);
        }
    }

    // 4. PM Creates Projects
    console.log('\n🏗️  Creating Projects (PM)...');
    const projectIds = [];
    try {
        const res = await axios.post(`${API_BASE_URL}/projects`, {
            title: 'Downtown Commercial Complex',
            description: 'A 5-story commercial complex in downtown area.',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            location: 'Downtown',
            status: 'active'
        }, { headers: { Authorization: `Bearer ${tokens.pm}` } });

        if (res.data.success) {
            projectIds.push(res.data.data.id);
            console.log(`   ✅ Project Created: ${res.data.data.title}`);
        }
    } catch (err) {
        console.log(`   ❌ Project Creation Failed: ${err.message}`);
    }

    // 5. PM Creates Milestones
    if (projectIds.length > 0) {
        console.log('\n🎯 Creating Milestones (PM)...');
        const milestones = [
            { title: 'Excavation & Foundation', amount: 50000, due_date: 30 },
            { title: 'Structural Framework', amount: 80000, due_date: 90 },
            { title: 'Interior Finishing', amount: 60000, due_date: 150 }
        ];

        for (const m of milestones) {
            try {
                await axios.post(`${API_BASE_URL}/milestones`, {
                    project_id: projectIds[0],
                    title: m.title,
                    amount: m.amount,
                    due_date: new Date(Date.now() + m.due_date * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'pending'
                }, { headers: { Authorization: `Bearer ${tokens.pm}` } });
                console.log(`   ✅ Milestone Created: ${m.title}`);
            } catch (err) {
                console.log(`   ❌ Milestone Failed: ${err.message}`);
            }
        }

        // 6. PM Creates Dispute
        console.log('\n⚖️  Creating Dispute (PM)...');
        try {
            await axios.post(`${API_BASE_URL}/disputes`, {
                project_id: projectIds[0],
                title: 'Delay in Material Delivery',
                reason: 'timeline_issues',
                description: 'The contractor has delayed material delivery by 2 weeks, affecting the timeline.',
                priority: 'high',
                status: 'open'
            }, { headers: { Authorization: `Bearer ${tokens.pm}` } });
            console.log('   ✅ Dispute Created');
        } catch (err) {
            console.log(`   ❌ Dispute Failed: ${err.message}`);
        }
    }

    // 7. Sub & Trade Apply for Jobs
    console.log('\n📝 Submitting Applications (Sub & Trade)...');
    if (jobIds.length > 0) {
        try {
            // Sub applies
            const subRes = await axios.post(`${API_BASE_URL}/applications`, {
                job_id: jobIds[0],
                cover_letter: 'I am an experienced subcontractor available for this project.',
                proposed_rate: 50000,
                available_start_date: new Date().toISOString().split('T')[0]
            }, { headers: { Authorization: `Bearer ${tokens.sub}` } });
            console.log('   ✅ Sub Applied to Job');

            // Trade applies
            const tradeRes = await axios.post(`${API_BASE_URL}/applications`, {
                job_id: jobIds[0],
                cover_letter: 'I am a specialized trade expert for this work.',
                proposed_rate: 30000,
                available_start_date: new Date().toISOString().split('T')[0]
            }, { headers: { Authorization: `Bearer ${tokens.trade}` } });
            console.log('   ✅ Trade Applied to Job');

            // 8. PM Approves Sub Application
            console.log('\n🤝 PM Approving Application...');
            if (subRes.data.success) {
                const appId = subRes.data.data.id;
                await axios.put(`${API_BASE_URL}/applications/${appId}/status`, {
                    status: 'accepted',
                    notes: 'Welcome to the team!'
                }, { headers: { Authorization: `Bearer ${tokens.pm}` } });
                console.log('   ✅ PM Approved Sub Application');
            }

        } catch (err) {
            console.log(`   ❌ Application Failed: ${err.message}`);
            if (err.response) console.log(JSON.stringify(err.response.data));
        }
    }

    // 9. Finance Check (Admin)
    console.log('\n💳 Checking Finance (Finance/Admin)...');
    try {
        const res = await axios.get(`${API_BASE_URL}/admin/payouts`, {
            headers: { Authorization: `Bearer ${tokens.finance}` }
        });
        console.log(`   ✅ Finance Dashboard Accessible. Payouts found: ${res.data.data?.length || 0}`);
    } catch (err) {
        console.log(`   ❌ Finance Check Failed: ${err.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Data Generation Complete!');
    console.log('   All roles now have relevant data in their dashboards.\n');
}

generateData();
