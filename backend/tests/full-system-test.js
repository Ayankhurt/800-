
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api/v1';

// Utilities
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(method, endpoint, token = null, data = null, isMultipart = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${endpoint}`);
        const options = {
            method,
            headers: {}
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        let body;
        if (data) {
            if (isMultipart) {
                const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
                options.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
                body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n(dummy image data)\r\n--${boundary}--`;
            } else {
                options.headers['Content-Type'] = 'application/json';
                body = JSON.stringify(data);
            }
        }

        const req = http.request(url, options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) req.write(body);
        req.end();
    });
}

// Test State
const state = {
    tokens: {},
    users: {},
    project: null,
    bid: null,
    contract: null,
    milestone: null
};

async function runTests() {
    console.log('🚀 STARTING FULL SYSTEM CLIENT REQUIREMENT TEST 🚀');
    console.log('==================================================');

    try {
        // 1. AUTHENTICATION & SETUP
        console.log('\n📦 STAGE 1: AUTHENTICATION & SETUP');

        // Login Admin
        const adminRes = await request('POST', '/auth/login', null, {
            email: 'admin@bidroom.com',
            password: 'Test123!@#'
        });

        if (adminRes.status === 200) {
            state.tokens.admin = adminRes.data.data.token;
            state.users.admin = adminRes.data.data.user;
            console.log('✅ Admin Login Success');
        } else {
            console.log(`⚠️  Admin Login Failed: ${JSON.stringify(adminRes.data)}`);
            // Attempt to signup a NEW dynamic admin
            const dynamicAdminEmail = `admin_${Date.now()}@test.com`;
            console.log(`ℹ️  Creating dynamic admin: ${dynamicAdminEmail}`);

            const adminSignupRes = await request('POST', '/auth/signup', null, {
                email: dynamicAdminEmail,
                password: 'Test123!@#',
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin'
            });
            if (adminSignupRes.status === 200 || adminSignupRes.status === 201) {
                state.tokens.admin = adminSignupRes.data.data.token;
                console.log('✅ Admin Signup Success (Fallback Dynamic)');
            } else {
                console.log(`❌ Admin Signup Failed: ${JSON.stringify(adminSignupRes.data)}`);
            }
        }

        // Signup/Login Client (Homeowner)
        const clientEmail = `client_${Date.now()}@test.com`;
        const clientRes = await request('POST', '/auth/signup', null, {
            email: clientEmail,
            password: 'Password123!',
            first_name: 'Test',
            last_name: 'Client',
            role: 'homeowner'
        });
        if (clientRes.status === 200 || clientRes.status === 201) {
            state.tokens.client = clientRes.data.data.token;
            state.users.client = clientRes.data.data.user;
            console.log('✅ Client Signup Success');
        } else {
            console.log(`❌ Client Signup Failed (Status ${clientRes.status}): ${JSON.stringify(clientRes.data)}`);
            throw new Error('Client Signup Failed');
        }

        // Signup/Login Contractor
        const contractorEmail = `cont_${Date.now()}@test.com`;
        const contRes = await request('POST', '/auth/signup', null, {
            email: contractorEmail,
            password: 'Password123!',
            first_name: 'Test',
            last_name: 'Contractor',
            role: 'general_contractor'
        });
        if (contRes.status === 200 || contRes.status === 201) {
            state.tokens.contractor = contRes.data.data.token;
            state.users.contractor = contRes.data.data.user;
            console.log('✅ Contractor Signup Success');
        } else {
            console.log(`❌ Contractor Signup Failed (Status ${contRes.status}): ${JSON.stringify(contRes.data)}`);
            throw new Error('Contractor Signup Failed');
        }

        // 2. PROJECT LIFECYCLE
        console.log('\n🏗️  STAGE 2: PROJECT CREATION');

        // Create Project
        const projRes = await request('POST', '/projects', state.tokens.client, {
            title: "Luxury Villa Renovation",
            description: "Full renovation of a 2-story villa including pool.",
            budget: 150000,
            location: "Beverly Hills, CA",
            category: "Residential"
        });

        if (projRes.status === 201 || projRes.status === 200) {
            state.project = projRes.data.data;
            console.log(`✅ Project Created: ${state.project.title} (ID: ${state.project.id})`);
        } else {
            console.log(`DEBUG: Project Create Response: `, JSON.stringify(projRes));
            throw new Error(`Failed to create project: ${JSON.stringify(projRes.data)}`);
        }

        // 3. BIDDING SYSTEM
        console.log('\n💰 STAGE 3: BIDDING');

        // Submit Bid
        const bidRes = await request('POST', '/bids', state.tokens.contractor, {
            project_id: state.project.id,
            amount: 145000,
            proposal: "I can do this job with premium materials.",
            timeline_days: 90
        });

        if (bidRes.status === 201 || bidRes.status === 200) {
            state.bid = bidRes.data.data;
            console.log(`✅ Bid Submitted: $${state.bid.amount} (ID: ${state.bid.id})`);
        } else {
            console.log(`❌ Bid Submission Failed: ${JSON.stringify(bidRes.data)}`);
        }

        // Project Owner Accepts Bid
        if (state.bid) {
            // Using 'awarded' to bypass potential 'accepted' constraint
            const acceptRes = await request('PUT', `/bids/${state.bid.id}/status`, state.tokens.client, {
                status: 'awarded'
            });

            if (acceptRes.status === 200) {
                console.log('✅ Bid Accepted by Client (Status Awarded)');
            } else {
                console.log(`⚠️  Could not accept bid (might need specific endpoint): ${JSON.stringify(acceptRes.data)}`);
            }
        }

        // 4. AI FEATURES
        console.log('\n🤖 STAGE 4: AI FEATURES');

        // Generate Contract
        if (state.bid) {
            const contractRes = await request('POST', '/ai/generate-contract', state.tokens.client, {
                projectId: state.project.id,
                bidId: state.bid.id,
                ownerNotes: "Ensure pool safety regulations are met."
            });

            if (contractRes.status === 200) {
                console.log('✅ AI Contract Generated Successfully');
            } else {
                console.log(`❌ AI Contract Generation Failed: ${JSON.stringify(contractRes.data)}`);
            }
        }

        // Generate Setup Timeline
        const timelineRes = await request('POST', `/ai/projects/${state.project.id}/generate-timeline`, state.tokens.client, {
            startDate: "2024-06-01"
        });

        if (timelineRes.status === 200) {
            console.log('✅ AI Timeline Generated Successfully');
            if (timelineRes.data.data.milestonesCreated > 0) {
                console.log(`   - Created ${timelineRes.data.data.milestonesCreated} milestones automatically.`);
            }
        } else {
            console.log(`❌ AI Timeline Generation Failed: ${JSON.stringify(timelineRes.data)}`);
        }


        // 5. PAYMENTS & ESCROW
        console.log('\n💳 STAGE 5: PAYMENTS & ESCROW');

        const connectRes = await request('POST', '/payments/stripe/connect', state.tokens.contractor, {});
        if (connectRes.status === 200) {
            console.log('✅ Stripe Connect Onboarding Link Created');
        } else {
            console.log(`⚠️  Stripe Connect Failed (Expected if Stripe Keys invalid): ${JSON.stringify(connectRes.data)}`);
        }

        // 6. MODERATION (ADMIN)
        console.log('\n🛡️  STAGE 6: MODERATION');

        // Note: Using /reports as it's the mount point for reporting
        const reportRes = await request('POST', '/reports', state.tokens.contractor, {
            content_type: 'project',
            content_id: state.project.id,
            reason: 'checking moderation system',
            description: 'This is a test report'
        });

        if (reportRes.status === 201 || reportRes.status === 200) {
            console.log('✅ Content Reported Successfully');
            const reportId = reportRes.data.data.id;

            if (state.tokens.admin) {
                const queueRes = await request('GET', '/admin/moderation/queue', state.tokens.admin);
                if (queueRes.status === 200) {
                    console.log(`✅ Admin retrieved moderation queue (Count: ${queueRes.data.data.length})`);
                }

                // Approve using PUT
                const approveRes = await request('PUT', `/admin/moderation/${reportId}/approve`, state.tokens.admin, {
                    action_note: "False alarm, test report."
                });
                if (approveRes.status === 200) {
                    console.log('✅ Admin Resolved Report');
                } else {
                    console.log(`⚠️  Admin Resolve Failed: ${JSON.stringify(approveRes.data)}`);
                }
            } else {
                console.log('⚠️  Skipping Admin actions (No Admin Token)');
            }
        } else {
            console.log(`⚠️  Report creation failed: ${JSON.stringify(reportRes.data)}`);
        }

        console.log('\n✨ FULL SYSTEM TEST COMPLETED ✨');

    } catch (error) {
        console.error('\n❌ CRITICAL TEST FAILURE:', error);
    }
}

runTests();
