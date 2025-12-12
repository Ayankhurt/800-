import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { randomUUID } from 'crypto';

dotenv.config();

const API_URL = 'http://localhost:5000/api/v1';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_CREDENTIALS = {
    email: 'admin@example.com',
    password: 'password123'
};

let authToken = '';
let testJobId = '';
let testProjectId = '';
let testUserId = '';

// Helper for formatted logs
const log = (msg, type = 'info') => {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', step: '👉' };
    console.log(`${icons[type]} ${msg}`);
};

const countApis = () => {
    try {
        const openApiContent = fs.readFileSync('openapi_full.yaml', 'utf8');
        const paths = openApiContent.match(/^\s\s\/[\w\-{}/]+:/gm);
        const count = paths ? paths.length : 0;
        log(`Total Documented API Endpoints: ${count}`, 'info');
        return count;
    } catch (e) {
        log(`Could not count APIs: ${e.message}`, 'warn');
        return 0;
    }
};

const authenticate = async () => {
    log('Authenticating Admin...', 'step');
    try {
        const res = await axios.post(`${API_URL}/auth/login`, ADMIN_CREDENTIALS);
        authToken = res.data.data.token;
        log('Authentication successful.', 'success');
    } catch (err) {
        log(`Authentication failed: ${err.message}`, 'error');
        process.exit(1);
    }
};

const testJobCRUD = async () => {
    log('Testing Job CRUD...', 'step');
    const headers = { Authorization: `Bearer ${authToken}` };

    // 1. Create
    try {
        const res = await axios.post(`${API_URL}/jobs`, {
            title: "Integration Test Job",
            description: "Created by comprehensive test suite",
            location: "Test City",
            trade_type: "plumbing",
            urgency: "medium",
            budget_min: 100,
            budget_max: 200
        }, { headers });
        testJobId = res.data.data.id;
        log('Job Created.', 'success');
    } catch (e) { log(`Job Create Failed: ${e.message}`, 'error'); return; }

    // 2. Read
    try {
        await axios.get(`${API_URL}/jobs/${testJobId}`, { headers });
        log('Job Read Verified.', 'success');
    } catch (e) { log(`Job Read Failed: ${e.message}`, 'error'); }

    // 3. Update
    try {
        await axios.put(`${API_URL}/jobs/${testJobId}`, { title: "Updated Job Title" }, { headers });
        log('Job Updated.', 'success');
    } catch (e) { log(`Job Update Failed: ${e.message}`, 'error'); }

    // 4. Delete
    try {
        await axios.delete(`${API_URL}/jobs/${testJobId}`, { headers });
        log('Job Deleted.', 'success');
    } catch (e) { log(`Job Delete Failed: ${e.message}`, 'error'); }
};

const testProjectAndMilestones = async () => {
    log('Testing Projects & Milestones...', 'step');
    const headers = { Authorization: `Bearer ${authToken}` };

    // 1. Seed a Project
    const { data: user } = await supabase.auth.admin.listUsers();
    const ownerId = user.users.find(u => u.email === ADMIN_CREDENTIALS.email)?.id;

    // Create dummy project directly in DB
    const { data: project, error } = await supabase.from('projects').insert({
        project_id: randomUUID(), // Fix for missing project_id
        title: "Test Project for API",
        description: "Seeded by test script",
        owner_id: ownerId,
        status: "open",
        budget: 5000
    }).select().single();

    if (error) {
        log(`Failed to seed project: ${error.message}`, 'error');
        return;
    }
    testProjectId = project.id;
    log(`Seeded Project ID: ${testProjectId}`, 'success');

    // 2. GET Project API
    try {
        await axios.get(`${API_URL}/projects/${testProjectId}`, { headers });
        log('Project API GET Verified.', 'success');
    } catch (e) { log(`Project GET Failed: ${e.message}`, 'error'); }

    // 3. Create Milestone API
    try {
        const milestoneData = {
            title: "Phase 1",
            description: "First phase",
            due_date: new Date().toISOString(),
            payment_amount: 1000,
            status: "pending",
            order_number: 1
        };
        await axios.post(`${API_URL}/projects/${testProjectId}/milestones`, milestoneData, { headers });
        log('Milestone Creation API Verified.', 'success');
    } catch (e) { log(`Milestone Create Failed: ${e.response?.data?.message || e.message}`, 'error'); }

    // Cleanup Project
    await supabase.from('projects').delete().eq('id', testProjectId);
    log('Cleanup: Seeded Project deleted.', 'info');
};

const testAdminUserManagement = async () => {
    log('Testing Admin User Management...', 'step');
    const headers = { Authorization: `Bearer ${authToken}` };

    // 1. Create a dummy user via Supabase
    const seedEmail = `testuser_${Date.now()}@test.com`;
    const { data: user, error } = await supabase.auth.admin.createUser({
        email: seedEmail,
        password: 'password123',
        email_confirm: true
    });

    if (error) {
        log(`Failed to seed user: ${error.message}`, 'error');
        return;
    }
    testUserId = user.user.id;
    log(`Seeded Test User: ${testUserId}`, 'success');

    await new Promise(r => setTimeout(r, 1000));

    // 2. GET User (Admin)
    try {
        await axios.get(`${API_URL}/admin/users/${testUserId}`, { headers });
        log('Admin GET User Verified.', 'success');
    } catch (e) { log(`Admin GET User Failed: ${e.message}`, 'error'); }

    // 3. Suspend User
    try {
        await axios.post(`${API_URL}/admin/users/${testUserId}/suspend`, {}, { headers });
        log('Admin Suspend User Verified.', 'success');
    } catch (e) {
        log(`Admin Suspend User Failed: ${e.response?.status} ${e.response?.statusText}`, 'error');
    }

    // 4. Delete User (Admin)
    try {
        await axios.delete(`${API_URL}/admin/users/${testUserId}`, { headers });
        log('Admin Delete User Verified.', 'success');
    } catch (e) { log(`Admin Delete User Failed: ${e.message}`, 'error'); }
};

const testConnectivity = async () => {
    log('Testing Connectivity for other modules...', 'step');
    const headers = { Authorization: `Bearer ${authToken}` };
    const endpoints = [
        '/finance/transactions',
        '/communication/conversations',
        '/notifications',
        '/admin/dashboard/stats'
    ];

    for (const ep of endpoints) {
        try {
            await axios.get(`${API_URL}${ep}`, { headers });
            log(`${ep}: OK`, 'success');
        } catch (e) {
            log(`${ep}: Failed (${e.message})`, 'error');
        }
    }
};

const run = async () => {
    console.log("\n🚀 STARTING COMPREHENSIVE API CHECK\n");
    countApis();
    await authenticate();
    await testJobCRUD();
    await testProjectAndMilestones();
    await testAdminUserManagement();
    await testConnectivity();
    console.log("\n✨ CHECK COMPLETE\n");
};

run();
