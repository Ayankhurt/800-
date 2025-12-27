#!/usr/bin/env node

/**
 * Complete API Test Suite
 * Tests: Login, Job Creation, Milestone Creation, and All Major Features
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://192.168.1.113:5000/api/v1';
const TEST_USERS = {
    admin: { email: 'admin@bidroom.com', password: 'ayan1212' },
    pm: { email: 'pm@test.com', password: 'ayan1212' },
    gc: { email: 'cont@bidroom.com', password: 'ayan1212' },
    sub: { email: 'sub@bidroom.com', password: 'ayan1212' },
    ts: { email: 'trade@bidroom.com', password: 'ayan1212' },
    finance: { email: 'finance@bidroom.com', password: 'ayan1212' },
};

let authTokens = {};
let testData = {
    jobId: null,
    projectId: null,
    milestoneId: null,
    bidId: null,
    disputeId: null,
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
    const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...(data && { data }),
    };

    try {
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status,
        };
    }
}

// Test 1: Login as different users
async function testLogin() {
    console.log('\n🔐 TEST 1: User Login');
    console.log('='.repeat(50));

    for (const [role, credentials] of Object.entries(TEST_USERS)) {
        console.log(`\n  Testing ${role.toUpperCase()} login...`);
        const result = await apiCall('POST', '/auth/login', credentials);

        if (result.success && result.data.data?.token) {
            authTokens[role] = result.data.data.token;
            const user = result.data.data.user;
            console.log(`  ✅ ${role.toUpperCase()} logged in successfully`);
            console.log(`     Email: ${user.email}`);
            console.log(`     Role: ${user.role}`);
            console.log(`     Name: ${user.first_name} ${user.last_name}`);
        } else {
            console.log(`  ❌ ${role.toUpperCase()} login failed: ${result.error}`);
        }
    }
}

// Test 2: Create a Job (as PM)
async function testJobCreation() {
    console.log('\n📋 TEST 2: Job Creation (PM Role)');
    console.log('='.repeat(50));

    const jobData = {
        title: 'Test Construction Job - ' + new Date().toISOString(),
        description: 'This is a test job created via API testing',
        location: 'Test City, Test State',
        budget: 50000,
        timeline: '3 months',
        required_skills: ['Carpentry', 'Plumbing', 'Electrical'],
        job_type: 'full-time',
        experience_level: 'intermediate',
    };

    console.log('\n  Creating job with PM token...');
    const result = await apiCall('POST', '/jobs', jobData, authTokens.pm);

    if (result.success && result.data.data) {
        testData.jobId = result.data.data.id;
        console.log('  ✅ Job created successfully');
        console.log(`     Job ID: ${testData.jobId}`);
        console.log(`     Title: ${result.data.data.title}`);
        console.log(`     Budget: $${result.data.data.budget}`);
    } else {
        console.log(`  ❌ Job creation failed: ${result.error}`);
    }
}

// Test 3: Get Job Details
async function testGetJob() {
    console.log('\n📄 TEST 3: Get Job Details');
    console.log('='.repeat(50));

    if (!testData.jobId) {
        console.log('  ⚠️  Skipped: No job ID available');
        return;
    }

    console.log(`\n  Fetching job ${testData.jobId}...`);
    const result = await apiCall('GET', `/jobs/${testData.jobId}`, null, authTokens.pm);

    if (result.success && result.data.data) {
        console.log('  ✅ Job retrieved successfully');
        console.log(`     Title: ${result.data.data.title}`);
        console.log(`     Status: ${result.data.data.status}`);
        console.log(`     Posted by: ${result.data.data.posted_by}`);
    } else {
        console.log(`  ❌ Failed to get job: ${result.error}`);
    }
}

// Test 4: Submit a Bid (as GC)
async function testBidSubmission() {
    console.log('\n💰 TEST 4: Bid Submission (GC Role)');
    console.log('='.repeat(50));

    if (!testData.jobId) {
        console.log('  ⚠️  Skipped: No job ID available');
        return;
    }

    const bidData = {
        job_id: testData.jobId,
        title: 'Competitive Bid for Test Construction Job',
        description: 'We can complete this project efficiently with our experienced team. Our proposal includes detailed milestones and competitive pricing.',
        amount: 45000,
        timeline: '2.5 months',
        proposal: 'We can complete this project efficiently with our experienced team.',
        milestones: [
            { title: 'Foundation', amount: 15000, duration: '2 weeks' },
            { title: 'Structure', amount: 20000, duration: '4 weeks' },
            { title: 'Finishing', amount: 10000, duration: '2 weeks' },
        ],
    };

    console.log('\n  Submitting bid as GC...');
    const result = await apiCall('POST', '/bids', bidData, authTokens.gc);

    if (result.success && result.data.data) {
        testData.bidId = result.data.data.id;
        console.log('  ✅ Bid submitted successfully');
        console.log(`     Bid ID: ${testData.bidId}`);
        console.log(`     Amount: $${result.data.data.amount}`);
        console.log(`     Status: ${result.data.data.status}`);
    } else {
        console.log(`  ❌ Bid submission failed: ${result.error}`);
    }
}

// Test 5: Create a Project (as PM)
async function testProjectCreation() {
    console.log('\n🏗️  TEST 5: Project Creation (PM Role)');
    console.log('='.repeat(50));

    const projectData = {
        title: 'Test Project - ' + new Date().toISOString(),
        description: 'This is a test project created via API testing',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Test Location',
        status: 'active',
    };

    console.log('\n  Creating project as PM...');
    const result = await apiCall('POST', '/projects', projectData, authTokens.pm);

    if (result.success && result.data.data) {
        testData.projectId = result.data.data.id;
        console.log('  ✅ Project created successfully');
        console.log(`     Project ID: ${testData.projectId}`);
        console.log(`     Title: ${result.data.data.title}`);
        console.log(`     Budget: $${result.data.data.budget}`);
        console.log(`     Status: ${result.data.data.status}`);
    } else {
        console.log(`  ❌ Project creation failed: ${result.error}`);
    }
}

// Test 6: Create Milestones (as PM)
async function testMilestoneCreation() {
    console.log('\n🎯 TEST 6: Milestone Creation (PM Role)');
    console.log('='.repeat(50));

    if (!testData.projectId) {
        console.log('  ⚠️  Skipped: No project ID available');
        return;
    }

    const milestones = [
        {
            project_id: testData.projectId,
            title: 'Project Planning',
            amount: 20000,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
        },
        {
            project_id: testData.projectId,
            title: 'Foundation Work',
            amount: 40000,
            due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
        },
        {
            project_id: testData.projectId,
            title: 'Final Completion',
            amount: 40000,
            due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending',
        },
    ];

    for (let i = 0; i < milestones.length; i++) {
        console.log(`\n  Creating milestone ${i + 1}/${milestones.length}...`);
        const result = await apiCall('POST', '/milestones', milestones[i], authTokens.pm);

        if (result.success && result.data.data) {
            if (i === 0) testData.milestoneId = result.data.data.id;
            console.log(`  ✅ Milestone created: ${result.data.data.title}`);
            console.log(`     ID: ${result.data.data.id}`);
            console.log(`     Amount: $${result.data.data.amount}`);
            console.log(`     Due: ${result.data.data.due_date}`);
        } else {
            console.log(`  ❌ Milestone creation failed: ${result.error}`);
        }
    }
}

// Test 7: Get User Dashboard Stats
async function testDashboardStats() {
    console.log('\n📊 TEST 7: Dashboard Statistics');
    console.log('='.repeat(50));

    for (const [role, token] of Object.entries(authTokens)) {
        if (!token) continue;

        console.log(`\n  Fetching ${role.toUpperCase()} dashboard...`);
        const endpoint = role === 'admin' ? '/stats/admin-dashboard' : '/stats/user-dashboard';
        const result = await apiCall('GET', endpoint, null, token);

        if (result.success && result.data.data) {
            const stats = result.data.data;
            console.log(`  ✅ ${role.toUpperCase()} stats retrieved`);

            if (role === 'admin') {
                console.log(`     Total Users: ${stats.total_users || 0}`);
                console.log(`     Total Jobs: ${stats.total_jobs || 0}`);
                console.log(`     Total Projects: ${stats.total_projects || 0}`);
            } else {
                console.log(`     Active Jobs: ${stats.active_jobs || 0}`);
                console.log(`     Active Projects: ${stats.active_projects || 0}`);
                console.log(`     Pending Bids: ${stats.pending_bids || 0}`);
            }
        } else {
            console.log(`  ⚠️  ${role.toUpperCase()} stats not available: ${result.error}`);
        }
    }
}

// Test 8: Admin Panel - Get All Users
async function testAdminGetUsers() {
    console.log('\n👥 TEST 8: Admin Panel - Get All Users');
    console.log('='.repeat(50));

    if (!authTokens.admin) {
        console.log('  ⚠️  Skipped: No admin token available');
        return;
    }

    console.log('\n  Fetching all users as admin...');
    const result = await apiCall('GET', '/admin/users?page=1&limit=10', null, authTokens.admin);

    if (result.success && result.data.data) {
        const users = result.data.data.users || result.data.data;
        console.log(`  ✅ Retrieved ${users.length} users`);
        console.log(`     Total: ${result.data.data.total || users.length}`);

        if (users.length > 0) {
            console.log('\n  Sample users:');
            users.slice(0, 3).forEach((user, i) => {
                console.log(`     ${i + 1}. ${user.email} (${user.role})`);
            });
        }
    } else {
        console.log(`  ❌ Failed to get users: ${result.error}`);
    }
}

// Test 9: Admin Panel - Get All Projects
async function testAdminGetProjects() {
    console.log('\n🏗️  TEST 9: Admin Panel - Get All Projects');
    console.log('='.repeat(50));

    if (!authTokens.admin) {
        console.log('  ⚠️  Skipped: No admin token available');
        return;
    }

    console.log('\n  Fetching all projects as admin...');
    const result = await apiCall('GET', '/admin/projects', null, authTokens.admin);

    if (result.success && result.data.data) {
        const projects = Array.isArray(result.data.data) ? result.data.data : [result.data.data];
        console.log(`  ✅ Retrieved ${projects.length} projects`);

        if (projects.length > 0) {
            console.log('\n  Sample projects:');
            projects.slice(0, 3).forEach((project, i) => {
                console.log(`     ${i + 1}. ${project.title} - $${project.budget} (${project.status})`);
            });
        }
    } else {
        console.log(`  ❌ Failed to get projects: ${result.error}`);
    }
}

// Test 10: Create a Dispute
async function testDisputeCreation() {
    console.log('\n⚖️  TEST 10: Dispute Creation');
    console.log('='.repeat(50));

    if (!testData.projectId) {
        console.log('  ⚠️  Skipped: No project ID available');
        return;
    }

    const disputeData = {
        project_id: testData.projectId,
        title: 'Test Dispute - Payment Issue',
        reason: 'payment_delay',
        description: 'This is a test dispute for payment verification. The milestone payment was not received on the agreed date, causing delays in the project timeline.',
        priority: 'medium',
        status: 'open',
    };

    console.log('\n  Creating dispute as PM...');
    const result = await apiCall('POST', '/disputes', disputeData, authTokens.pm);

    if (result.success && result.data.data) {
        testData.disputeId = result.data.data.id;
        console.log('  ✅ Dispute created successfully');
        console.log(`     Dispute ID: ${testData.disputeId}`);
        console.log(`     Title: ${result.data.data.title}`);
        console.log(`     Priority: ${result.data.data.priority}`);
        console.log(`     Status: ${result.data.data.status}`);
    } else {
        console.log(`  ❌ Dispute creation failed: ${result.error}`);
    }
}

// Test 11: Finance - Get Payouts
async function testFinancePayouts() {
    console.log('\n💳 TEST 11: Finance - Get Payouts');
    console.log('='.repeat(50));

    if (!authTokens.finance && !authTokens.admin) {
        console.log('  ⚠️  Skipped: No finance/admin token available');
        return;
    }

    const token = authTokens.finance || authTokens.admin;
    console.log('\n  Fetching payouts...');
    const result = await apiCall('GET', '/admin/payouts', null, token);

    if (result.success && result.data.data) {
        const payouts = Array.isArray(result.data.data) ? result.data.data : [result.data.data];
        console.log(`  ✅ Retrieved ${payouts.length} payouts`);

        if (payouts.length > 0) {
            console.log('\n  Sample payouts:');
            payouts.slice(0, 3).forEach((payout, i) => {
                console.log(`     ${i + 1}. $${payout.amount} - ${payout.status}`);
            });
        }
    } else {
        console.log(`  ⚠️  No payouts available: ${result.error}`);
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         COMPLETE API TEST SUITE - BidRoom Platform       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\nAPI Base URL: ${API_BASE_URL}`);
    console.log(`Test Started: ${new Date().toLocaleString()}`);

    try {
        await testLogin();
        await testJobCreation();
        await testGetJob();
        await testBidSubmission();
        await testProjectCreation();
        await testMilestoneCreation();
        await testDashboardStats();
        await testAdminGetUsers();
        await testAdminGetProjects();
        await testDisputeCreation();
        await testFinancePayouts();

        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║                    TEST SUMMARY                           ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('\n📋 Test Data Created:');
        console.log(`   Job ID: ${testData.jobId || 'N/A'}`);
        console.log(`   Project ID: ${testData.projectId || 'N/A'}`);
        console.log(`   Milestone ID: ${testData.milestoneId || 'N/A'}`);
        console.log(`   Bid ID: ${testData.bidId || 'N/A'}`);
        console.log(`   Dispute ID: ${testData.disputeId || 'N/A'}`);

        console.log('\n🔑 Auth Tokens:');
        Object.entries(authTokens).forEach(([role, token]) => {
            console.log(`   ${role.toUpperCase()}: ${token ? '✅ Available' : '❌ Missing'}`);
        });

        console.log(`\n✅ Test Suite Completed: ${new Date().toLocaleString()}\n`);
    } catch (error) {
        console.error('\n❌ Test Suite Failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
runAllTests();
