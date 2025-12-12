import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

// Test credentials
let adminToken = '';
let clientToken = '';
let contractorToken = '';
let adminUser = null;
let clientUser = null;
let contractorUser = null;

// Created resource IDs for testing
let createdProjectId = '';
let createdJobId = '';
let createdBidId = '';
let createdAppointmentId = '';
let createdAnnouncementId = '';
let createdBadgeId = '';
let createdQuoteId = '';
let createdSupportTicketId = '';

// Helper function to make requests
async function makeRequest(method, endpoint, token, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        };
        if (data) config.data = data;

        const response = await axios(config);
        return { status: response.status, data: response.data };
    } catch (error) {
        return {
            status: error.response?.status || 500,
            error: error.response?.data?.message || error.message
        };
    }
}

// Setup: Create test users
async function setupTestUsers() {
    console.log('\n🔧 SETTING UP TEST USERS...\n');

    // Create Admin
    const adminEmail = `admin_full_${Date.now()}@test.com`;
    const adminRes = await makeRequest('POST', '/auth/signup', null, {
        email: adminEmail,
        password: 'Admin@123',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
    });

    if (adminRes.status === 201) {
        adminToken = adminRes.data.data.token;
        adminUser = adminRes.data.data.user;
        console.log('✅ Admin Created');
    } else {
        console.log('❌ Admin Creation Failed');
        process.exit(1);
    }

    // Create Client
    const clientEmail = `client_full_${Date.now()}@test.com`;
    const clientRes = await makeRequest('POST', '/auth/signup', null, {
        email: clientEmail,
        password: 'Client@123',
        first_name: 'Test',
        last_name: 'Client',
        role: 'client'
    });

    if (clientRes.status === 201) {
        clientToken = clientRes.data.data.token;
        clientUser = clientRes.data.data.user;
        console.log('✅ Client Created');
    }

    // Create Contractor
    const contractorEmail = `contractor_full_${Date.now()}@test.com`;
    const contractorRes = await makeRequest('POST', '/auth/signup', null, {
        email: contractorEmail,
        password: 'Contractor@123',
        first_name: 'Test',
        last_name: 'Contractor',
        role: 'contractor',
        company_name: 'Test Construction Co'
    });

    if (contractorRes.status === 201) {
        contractorToken = contractorRes.data.data.token;
        contractorUser = contractorRes.data.data.user;
        console.log('✅ Contractor Created\n');
    }
}

// Test Projects CRUD
async function testProjects() {
    console.log('--- Testing PROJECTS (CRUD) ---');

    // POST - Create Project
    const createRes = await makeRequest('POST', '/projects', clientToken, {
        title: 'Test Project',
        description: 'Test project description',
        budget: 50000,
        location: 'Los Angeles, CA',
        category: 'Residential',
        start_date: '2025-01-15',
        end_date: '2025-06-15'
    });

    if (createRes.status === 201) {
        createdProjectId = createRes.data.data.id;
        console.log(`✅ POST /projects - ${createRes.status}`);
    } else {
        console.log(`❌ POST /projects - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read Projects
    const getRes = await makeRequest('GET', '/projects', clientToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /projects - ${getRes.status}`);

    // GET - Read Single Project
    if (createdProjectId) {
        const getSingleRes = await makeRequest('GET', `/projects/${createdProjectId}`, clientToken);
        console.log(`${getSingleRes.status === 200 ? '✅' : '❌'} GET /projects/:id - ${getSingleRes.status}`);

        // PUT - Update Project
        const updateRes = await makeRequest('PUT', `/projects/${createdProjectId}`, clientToken, {
            title: 'Updated Test Project',
            budget: 60000
        });
        console.log(`${updateRes.status === 200 ? '✅' : '❌'} PUT /projects/:id - ${updateRes.status}`);
    }
}

// Test Jobs CRUD
async function testJobs() {
    console.log('\n--- Testing JOBS (CRUD) ---');

    // POST - Create Job
    const createRes = await makeRequest('POST', '/jobs', clientToken, {
        title: 'Electrician Needed',
        description: 'Need licensed electrician for residential work',
        location: 'Los Angeles, CA',
        trade_type: 'Electrical',
        budget_min: 5000,
        budget_max: 10000,
        pay_type: 'fixed',
        start_date: '2025-02-01',
        urgency: 'medium'
    });

    if (createRes.status === 201) {
        createdJobId = createRes.data.data.id;
        console.log(`✅ POST /jobs - ${createRes.status}`);
    } else {
        console.log(`❌ POST /jobs - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read Jobs
    const getRes = await makeRequest('GET', '/jobs', contractorToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /jobs - ${getRes.status}`);

    // GET - Read Single Job
    if (createdJobId) {
        const getSingleRes = await makeRequest('GET', `/jobs/${createdJobId}`, contractorToken);
        console.log(`${getSingleRes.status === 200 ? '✅' : '❌'} GET /jobs/:id - ${getSingleRes.status}`);

        // PUT - Update Job
        const updateRes = await makeRequest('PUT', `/jobs/${createdJobId}`, clientToken, {
            title: 'Updated Electrician Job',
            budget_max: 12000
        });
        console.log(`${updateRes.status === 200 ? '✅' : '❌'} PUT /jobs/:id - ${updateRes.status}`);
    }
}

// Test Bids CRUD
async function testBids() {
    console.log('\n--- Testing BIDS (CRUD) ---');

    if (!createdJobId) {
        console.log('⚠️ Skipping bids test - no job created');
        return;
    }

    // POST - Place Bid
    const createRes = await makeRequest('POST', '/bids', contractorToken, {
        job_id: createdJobId,
        amount: 8500,
        notes: 'I can complete this work efficiently',
        timeline_days: 14
    });

    if (createRes.status === 201) {
        createdBidId = createRes.data.data.id;
        console.log(`✅ POST /bids - ${createRes.status}`);
    } else {
        console.log(`❌ POST /bids - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read My Bids
    const getRes = await makeRequest('GET', '/bids/my-bids', contractorToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /bids/my-bids - ${getRes.status}`);

    // GET - Read Job Bids (as job owner)
    const getJobBidsRes = await makeRequest('GET', `/bids/job/${createdJobId}`, clientToken);
    console.log(`${getJobBidsRes.status === 200 ? '✅' : '❌'} GET /bids/job/:id - ${getJobBidsRes.status}`);
}

// Test Appointments CRUD
async function testAppointments() {
    console.log('\n--- Testing APPOINTMENTS (CRUD) ---');

    // POST - Create Appointment
    const createRes = await makeRequest('POST', '/appointments', clientToken, {
        attendee_id: contractorUser.id,
        title: 'Project Discussion',
        description: 'Discuss project requirements',
        start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        end_time: new Date(Date.now() + 90000000).toISOString()
    });

    if (createRes.status === 201) {
        createdAppointmentId = createRes.data.data.id;
        console.log(`✅ POST /appointments - ${createRes.status}`);
    } else {
        console.log(`❌ POST /appointments - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read Appointments
    const getRes = await makeRequest('GET', '/appointments', clientToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /appointments - ${getRes.status}`);

    // PUT - Update Appointment
    if (createdAppointmentId) {
        const updateRes = await makeRequest('PUT', `/appointments/${createdAppointmentId}`, clientToken, {
            title: 'Updated Project Discussion',
            status: 'confirmed'
        });
        console.log(`${updateRes.status === 200 ? '✅' : '❌'} PUT /appointments/:id - ${updateRes.status}`);

        // DELETE - Cancel Appointment
        const deleteRes = await makeRequest('DELETE', `/appointments/${createdAppointmentId}`, clientToken);
        console.log(`${deleteRes.status === 200 ? '✅' : '❌'} DELETE /appointments/:id - ${deleteRes.status}`);
    }
}

// Test Admin - Announcements CRUD
async function testAnnouncements() {
    console.log('\n--- Testing ANNOUNCEMENTS (Admin CRUD) ---');

    // POST - Create Announcement
    const createRes = await makeRequest('POST', '/admin/announcements', adminToken, {
        title: 'System Maintenance',
        content: 'Scheduled maintenance on Sunday',
        type: 'maintenance',
        target_audience: 'all',
        is_active: true
    });

    if (createRes.status === 201 || createRes.status === 200) {
        createdAnnouncementId = createRes.data.data?.id;
        console.log(`✅ POST /admin/announcements - ${createRes.status}`);
    } else {
        console.log(`❌ POST /admin/announcements - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read Announcements
    const getRes = await makeRequest('GET', '/admin/announcements', adminToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /admin/announcements - ${getRes.status}`);

    // DELETE - Remove Announcement
    if (createdAnnouncementId) {
        const deleteRes = await makeRequest('DELETE', `/admin/announcements/${createdAnnouncementId}`, adminToken);
        console.log(`${deleteRes.status === 200 ? '✅' : '❌'} DELETE /admin/announcements/:id - ${deleteRes.status}`);
    }
}

// Test Admin - Badges CRUD
async function testBadges() {
    console.log('\n--- Testing BADGES (Admin CRUD) ---');

    // POST - Create Badge
    const createRes = await makeRequest('POST', '/admin/badges', adminToken, {
        name: 'Top Contractor',
        description: 'Awarded to top performing contractors',
        criteria: { min_projects: 10, min_rating: 4.5 }
    });

    if (createRes.status === 201 || createRes.status === 200) {
        createdBadgeId = createRes.data.data?.id;
        console.log(`✅ POST /admin/badges - ${createRes.status}`);
    } else {
        console.log(`❌ POST /admin/badges - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read Badges
    const getRes = await makeRequest('GET', '/badges', clientToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /badges - ${getRes.status}`);
}

// Test Quotes CRUD
async function testQuotes() {
    console.log('\n--- Testing QUOTES (CRUD) ---');

    // POST - Create Quote
    const createRes = await makeRequest('POST', '/quotes', contractorToken, {
        client_id: clientUser.id,
        project_title: 'Kitchen Renovation',
        items: [
            { description: 'Labor', quantity: 1, unit_price: 5000, total: 5000 },
            { description: 'Materials', quantity: 1, unit_price: 3000, total: 3000 }
        ],
        total_amount: 8000,
        valid_until: '2025-02-28',
        notes: 'Quote includes all labor and materials'
    });

    if (createRes.status === 201) {
        createdQuoteId = createRes.data.data.id;
        console.log(`✅ POST /quotes - ${createRes.status}`);
    } else {
        console.log(`❌ POST /quotes - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read Quotes
    const getRes = await makeRequest('GET', '/quotes', contractorToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /quotes - ${getRes.status}`);

    // PUT - Update Quote
    if (createdQuoteId) {
        const updateRes = await makeRequest('PUT', `/quotes/${createdQuoteId}`, contractorToken, {
            total_amount: 8500,
            notes: 'Updated quote with additional materials'
        });
        console.log(`${updateRes.status === 200 ? '✅' : '❌'} PUT /quotes/:id - ${updateRes.status}`);
    }
}

// Test Support Tickets CRUD
async function testSupportTickets() {
    console.log('\n--- Testing SUPPORT TICKETS (CRUD) ---');

    // POST - Create Support Ticket
    const createRes = await makeRequest('POST', '/support/tickets', clientToken, {
        subject: 'Payment Issue',
        description: 'Having trouble processing payment',
        category: 'billing',
        priority: 'high'
    });

    if (createRes.status === 201) {
        createdSupportTicketId = createRes.data.data.id;
        console.log(`✅ POST /support/tickets - ${createRes.status}`);
    } else {
        console.log(`❌ POST /support/tickets - ${createRes.status} - ${createRes.error}`);
    }

    // GET - Read My Tickets
    const getRes = await makeRequest('GET', '/support/tickets', clientToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /support/tickets - ${getRes.status}`);

    // GET - Admin view all tickets
    const adminGetRes = await makeRequest('GET', '/admin/support/tickets', adminToken);
    console.log(`${adminGetRes.status === 200 ? '✅' : '❌'} GET /admin/support/tickets - ${adminGetRes.status}`);
}

// Test Notifications CRUD
async function testNotifications() {
    console.log('\n--- Testing NOTIFICATIONS (CRUD) ---');

    // GET - Read Notifications
    const getRes = await makeRequest('GET', '/notifications', clientToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /notifications - ${getRes.status}`);

    // PUT - Mark as Read (if notifications exist)
    if (getRes.data?.data?.length > 0) {
        const notificationId = getRes.data.data[0].id;
        const updateRes = await makeRequest('PUT', `/notifications/${notificationId}/read`, clientToken);
        console.log(`${updateRes.status === 200 ? '✅' : '❌'} PUT /notifications/:id/read - ${updateRes.status}`);
    }
}

// Test User Settings CRUD
async function testUserSettings() {
    console.log('\n--- Testing USER SETTINGS (CRUD) ---');

    // GET - Read Settings
    const getRes = await makeRequest('GET', '/settings', clientToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /settings - ${getRes.status}`);

    // PUT - Update Settings
    const updateRes = await makeRequest('PUT', '/settings', clientToken, {
        email_notifications: true,
        push_notifications: false,
        language: 'en',
        timezone: 'America/Los_Angeles'
    });
    console.log(`${updateRes.status === 200 ? '✅' : '❌'} PUT /settings - ${updateRes.status}`);
}

// Test Saved Contractors CRUD
async function testSavedContractors() {
    console.log('\n--- Testing SAVED CONTRACTORS (CRUD) ---');

    // POST - Save Contractor
    const saveRes = await makeRequest('POST', '/saved', clientToken, {
        contractor_id: contractorUser.id
    });
    console.log(`${saveRes.status === 201 || saveRes.status === 200 ? '✅' : '❌'} POST /saved - ${saveRes.status}`);

    // GET - Read Saved Contractors
    const getRes = await makeRequest('GET', '/saved', clientToken);
    console.log(`${getRes.status === 200 ? '✅' : '❌'} GET /saved - ${getRes.status}`);

    // DELETE - Remove Saved Contractor
    const deleteRes = await makeRequest('DELETE', `/saved/${contractorUser.id}`, clientToken);
    console.log(`${deleteRes.status === 200 ? '✅' : '❌'} DELETE /saved/:id - ${deleteRes.status}`);
}

// Main test runner
async function runAllTests() {
    console.log('🚀 STARTING FULL CRUD API TEST SUITE 🚀\n');
    console.log('Testing: GET, POST, PUT, DELETE operations\n');

    await setupTestUsers();

    await testProjects();
    await testJobs();
    await testBids();
    await testAppointments();
    await testAnnouncements();
    await testBadges();
    await testQuotes();
    await testSupportTickets();
    await testNotifications();
    await testUserSettings();
    await testSavedContractors();

    console.log('\n✨ FULL CRUD TEST SUITE COMPLETED ✨\n');
}

runAllTests().catch(console.error);
