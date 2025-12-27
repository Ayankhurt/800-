import axios from 'axios';


const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';

const users = {
    admin: { email: 'admin@bidroom.com', password: 'ayan1212', role: 'admin' },
    pm: { email: 'pm@test.com', password: 'ayan1212', role: 'pm' },
    gc: { email: 'cont@bidroom.com', password: 'ayan1212', role: 'gc' },
    sub: { email: 'sub@bidroom.com', password: 'ayan1212', role: 'sub' },
};

let tokens = {};

async function audit() {
    console.log('🕵️‍♂️  ULTIMATE SYSTEM AUDIT STARTED');
    console.log('='.repeat(50));
    let errors = 0;

    async function check(name, fn) {
        try {
            process.stdout.write(`   Testing ${name.padEnd(30)} ... `);
            const start = Date.now();
            const res = await fn();
            const duration = Date.now() - start;
            console.log(`✅ PASS (${duration}ms) ${res ? '- ' + res : ''}`);
            if (duration > 2000) console.log(`      ⚠️  WARNING: Slow Response`);
        } catch (e) {
            console.log(`❌ FAIL`);
            console.log(`      Error: ${e.message}`);
            if (e.response) console.log(`      Status: ${e.response.status} Data: ${JSON.stringify(e.response.data)}`);
            errors++;
        }
    }

    // 1. AUTHENTICATION
    console.log('\n🔐 AUTHENTICATION MODULE');
    for (const [key, creds] of Object.entries(users)) {
        await check(`Login as ${key.toUpperCase()}`, async () => {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email: creds.email, password: creds.password });
            tokens[key] = res.data.data.token;
            return `Token received`;
        });
    }

    // 2. USER PROFILES
    console.log('\n👤 USER MODULE');
    await check('Get Admin Profile', async () => {
        const res = await axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        return `Role: ${res.data.data.role}`;
    });

    // 3. PROJECT MANAGEMENT (PM)
    console.log('\n🏗️  PROJECT MANAGEMENT MODULE');
    await check('Fetch Projects (PM)', async () => {
        const res = await axios.get(`${API_BASE_URL}/projects`, { headers: { Authorization: `Bearer ${tokens.pm}` } });
        const items = res.data.data.projects || res.data.data;
        return `Count: ${items.length}`;
    });

    await check('Fetch Jobs (PM)', async () => {
        const res = await axios.get(`${API_BASE_URL}/jobs`, { headers: { Authorization: `Bearer ${tokens.pm}` } });
        const items = res.data.data.jobs || res.data.data;
        return `Count: ${items.length}`;
    });

    await check('Fetch Milestones (PM)', async () => {
        const res = await axios.get(`${API_BASE_URL}/milestones`, { headers: { Authorization: `Bearer ${tokens.pm}` } });
        return `Count: ${res.data.data.length}`;
    });

    await check('Fetch Disputes (PM)', async () => {
        const res = await axios.get(`${API_BASE_URL}/disputes`, { headers: { Authorization: `Bearer ${tokens.pm}` } });
        const items = res.data.data.disputes || res.data.data;
        return `Count: ${items.length}`;
    });

    // 4. BIDDING SYSTEM (GC)
    console.log('\n💰 BIDDING MODULE');
    await check('Fetch My Bids (GC)', async () => {
        const res = await axios.get(`${API_BASE_URL}/bids/my-bids`, { headers: { Authorization: `Bearer ${tokens.gc}` } });
        return `Count: ${res.data.data.length}`;
    });

    await check('Search Open Jobs (GC)', async () => {
        const res = await axios.get(`${API_BASE_URL}/jobs?status=open`, { headers: { Authorization: `Bearer ${tokens.gc}` } });
        const items = res.data.data.jobs || res.data.data;
        return `Open Jobs: ${items.length}`;
    });

    // 5. SUB/TRADE SYSTEM
    console.log('\n📝 APPLICATION MODULE');
    await check('Fetch My Applications (Sub)', async () => {
        const res = await axios.get(`${API_BASE_URL}/applications/my-applications`, { headers: { Authorization: `Bearer ${tokens.sub}` } });
        return `Count: ${res.data.data.length}`;
    });

    // 6. ADMIN DASHBOARD
    console.log('\n🛡️  ADMIN MODULE');
    await check('Fetch All Users', async () => {
        const res = await axios.get(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        const items = res.data.data.users || res.data.data;
        return `Total Users: ${items.length}`;
    });

    await check('Fetch Payouts', async () => {
        const res = await axios.get(`${API_BASE_URL}/admin/payouts`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
        return `Payouts: ${res.data.data.length}`;
    });

    console.log('\n' + '='.repeat(50));
    if (errors === 0) {
        console.log('✅✅✅ SYSTEM AUDIT PASSED 100% ✅✅✅');
        console.log('   All Core Modules Functioning correctly.');
    } else {
        console.log(`⚠️  SYSTEM AUDIT FAILED with ${errors} errors.`);
    }
}

audit();
