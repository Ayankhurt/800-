/**
 * BidRoom App - Smoke Test & Release Check Script
 * 
 * Run with: node scripts/smoke-test.js
 * 
 * Requires:
 * - Backend server running at EXPO_PUBLIC_API_URL or default http://192.168.2.10:5000
 * - Test credentials in environment variables or .env file
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.10:5000';
const API_BASE = `${BASE_URL}/api/v1`;
const HEALTH_CHECK = `${BASE_URL}/api/health`;

// Test credentials (should be in .env or secrets)
const TEST_CREDS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@bidroom.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Admin123!'
  },
  pm: {
    email: process.env.TEST_PM_EMAIL || 'pm@bidroom.com',
    password: process.env.TEST_PM_PASSWORD || 'PM123!'
  },
  gc: {
    email: process.env.TEST_GC_EMAIL || 'gc@bidroom.com',
    password: process.env.TEST_GC_PASSWORD || 'GC123!'
  },
  sub: {
    email: process.env.TEST_SUB_EMAIL || 'sub@bidroom.com',
    password: process.env.TEST_SUB_PASSWORD || 'SUB123!'
  }
};

// Report structure
const report = {
  timestamp: new Date().toISOString(),
  health: false,
  endpointsChecked: [],
  actionFlows: [],
  adminChecks: [],
  notes: [],
  recommendedFixes: [],
  readiness: 'HOLD',
  criticalErrors: []
};

// Helper functions
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function checkEndpoint(name, method, path, token = null, data = null) {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${API_BASE}${path}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    const latency = Date.now() - startTime;
    
    const result = {
      name,
      path,
      method,
      status: response.status,
      latency_ms: latency,
      ok: response.status >= 200 && response.status < 300,
      bodyPreview: JSON.stringify(response.data).substring(0, 200)
    };

    report.endpointsChecked.push(result);
    return { success: true, data: response.data, result };
  } catch (error) {
    const latency = Date.now() - startTime;
    const status = error.response?.status || 0;
    const message = error.response?.data?.message || error.message;

    const result = {
      name,
      path,
      method,
      status,
      latency_ms: latency,
      ok: false,
      error: message,
      bodyPreview: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : error.message
    };

    report.endpointsChecked.push(result);
    
    if (status >= 500) {
      report.criticalErrors.push({ endpoint: path, status, error: message });
    }
    
    return { success: false, error: message, status, result };
  }
}

// 1. Health Checks
async function healthChecks() {
  log('🔍 Starting Health Checks...');
  
  // Main health check
  try {
    const response = await axios.get(HEALTH_CHECK);
    if (response.status === 200 && response.data?.status === 'ok') {
      report.health = true;
      log('✅ Health check passed');
    } else {
      report.health = false;
      report.notes.push(`Health check returned unexpected response: ${JSON.stringify(response.data)}`);
      log('⚠️  Health check returned unexpected response');
    }
  } catch (error) {
    report.health = false;
    report.criticalErrors.push({ endpoint: '/api/health', error: error.message });
    log(`❌ Health check failed: ${error.message}`);
    return false;
  }

  // Service base path checks
  const serviceChecks = [
    { name: 'Auth Service', path: '/auth/me' },
    { name: 'Users Service', path: '/users/me' },
    { name: 'Projects Service', path: '/projects?limit=1' },
    { name: 'Bids Service', path: '/bids?limit=1' },
    { name: 'Jobs Service', path: '/jobs?limit=1' },
    { name: 'Payments Service', path: '/payments?limit=1' },
    { name: 'Disputes Service', path: '/disputes?limit=1' },
    { name: 'Admin Logs', path: '/admin/logs?limit=1' },
    { name: 'Admin Notifications', path: '/admin/notifications?limit=1' }
  ];

  for (const check of serviceChecks) {
    await checkEndpoint(check.name, 'GET', check.path);
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
  }

  return true;
}

// 2. Auth & Session
async function authTests() {
  log('🔐 Testing Authentication...');
  
  let adminToken = null;
  let pmToken = null;
  let gcToken = null;
  let subToken = null;

  // Admin login
  const adminLogin = await checkEndpoint('Admin Login', 'POST', '/auth/login', null, {
    email: TEST_CREDS.admin.email,
    password: TEST_CREDS.admin.password
  });
  
  if (adminLogin.success && adminLogin.data?.token) {
    adminToken = adminLogin.data.token;
    log('✅ Admin login successful');
    
    // Test /auth/me
    const adminMe = await checkEndpoint('Admin /auth/me', 'GET', '/auth/me', adminToken);
    if (adminMe.success && adminMe.data?.role === 'ADMIN') {
      log('✅ Admin /auth/me verified');
    }
  } else {
    report.notes.push('Admin login failed - check credentials');
    log('⚠️  Admin login failed');
  }

  // PM login
  const pmLogin = await checkEndpoint('PM Login', 'POST', '/auth/login', null, {
    email: TEST_CREDS.pm.email,
    password: TEST_CREDS.pm.password
  });
  
  if (pmLogin.success && pmLogin.data?.token) {
    pmToken = pmLogin.data.token;
    log('✅ PM login successful');
  } else {
    report.notes.push('PM login failed - check credentials');
    log('⚠️  PM login failed');
  }

  // GC login
  const gcLogin = await checkEndpoint('GC Login', 'POST', '/auth/login', null, {
    email: TEST_CREDS.gc.email,
    password: TEST_CREDS.gc.password
  });
  
  if (gcLogin.success && gcLogin.data?.token) {
    gcToken = gcLogin.data.token;
    log('✅ GC login successful');
  }

  // SUB login
  const subLogin = await checkEndpoint('SUB Login', 'POST', '/auth/login', null, {
    email: TEST_CREDS.sub.email,
    password: TEST_CREDS.sub.password
  });
  
  if (subLogin.success && subLogin.data?.token) {
    subToken = subLogin.data.token;
    log('✅ SUB login successful');
  }

  return { adminToken, pmToken, gcToken, subToken };
}

// 3. Core Endpoints Smoke
async function coreEndpointsSmoke(tokens) {
  log('📦 Testing Core Endpoints...');
  
  const coreTests = [
    { name: 'Jobs List', path: '/jobs?limit=1', token: tokens.pmToken },
    { name: 'Bids List', path: '/bids?limit=1', token: tokens.pmToken },
    { name: 'Projects List', path: '/projects?limit=1', token: tokens.pmToken },
    { name: 'Disputes List', path: '/disputes?limit=1', token: tokens.pmToken },
    { name: 'Notifications List', path: '/notifications?limit=1', token: tokens.pmToken },
    { name: 'Conversations List', path: '/conversations?limit=1', token: tokens.pmToken }
  ];

  for (const test of coreTests) {
    await checkEndpoint(test.name, 'GET', test.path, test.token);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 4. Admin-Only Endpoints
async function adminEndpoints(adminToken) {
  if (!adminToken) {
    report.notes.push('Skipping admin endpoints - no admin token');
    return;
  }

  log('👑 Testing Admin Endpoints...');
  
  const adminTests = [
    { name: 'Admin All Users', path: '/admin/all-users', token: adminToken },
    { name: 'Admin Logs', path: '/admin/logs?limit=5', token: adminToken },
    { name: 'Admin Notifications', path: '/admin/notifications?limit=5', token: adminToken }
  ];

  for (const test of adminTests) {
    await checkEndpoint(test.name, 'GET', test.path, test.token);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Test payout approve/reject (if test payout exists)
  // This would require creating a test payout first
  report.adminChecks.push({
    note: 'Payout approve/reject tests require test payout data - skipped in smoke test'
  });
}

// 5. Action Flows
async function actionFlows(tokens) {
  log('🔄 Testing Action Flows...');
  
  const flows = [];

  // PM: Create Job
  if (tokens.pmToken) {
    const createJob = await checkEndpoint('PM Create Job', 'POST', '/jobs', tokens.pmToken, {
      title: 'Smoke Test Job',
      description: 'Test job created during smoke test',
      trade: 'Electrical',
      location: 'Test Location',
      budget: 1000,
      urgency: 'medium'
    });

    if (createJob.success && createJob.data?.id) {
      const jobId = createJob.data.id;
      flows.push({ flowName: 'PM Create Job', stepResults: ['✅ Job created', `Job ID: ${jobId}`] });
      
      // Get job details
      await checkEndpoint('Get Job Details', 'GET', `/jobs/${jobId}`, tokens.pmToken);
    } else {
      flows.push({ flowName: 'PM Create Job', stepResults: ['❌ Failed to create job'] });
    }
  }

  // SUB: Apply to Job
  if (tokens.subToken && tokens.pmToken) {
    // First get a job
    const jobsList = await checkEndpoint('Get Jobs for Application', 'GET', '/jobs?limit=1', tokens.subToken);
    if (jobsList.success && jobsList.data?.data?.length > 0) {
      const jobId = jobsList.data.data[0].id;
      const applyJob = await checkEndpoint('SUB Apply Job', 'POST', `/jobs/${jobId}/apply`, tokens.subToken, {
        coverLetter: 'Smoke test application',
        estimatedCompletion: '2024-12-31'
      });

      if (applyJob.success) {
        flows.push({ flowName: 'SUB Apply Job', stepResults: ['✅ Application submitted'] });
      } else {
        flows.push({ flowName: 'SUB Apply Job', stepResults: ['❌ Failed to apply'] });
      }
    }
  }

  // GC: Submit Bid
  if (tokens.gcToken) {
    const bidsList = await checkEndpoint('Get Bids for Submission', 'GET', '/bids?limit=1', tokens.gcToken);
    if (bidsList.success && bidsList.data?.data?.length > 0) {
      const bidId = bidsList.data.data[0].id;
      const submitBid = await checkEndpoint('GC Submit Bid', 'POST', `/bids/${bidId}/submit`, tokens.gcToken, {
        amount: 5000,
        notes: 'Smoke test bid submission'
      });

      if (submitBid.success) {
        flows.push({ flowName: 'GC Submit Bid', stepResults: ['✅ Bid submitted'] });
      } else {
        flows.push({ flowName: 'GC Submit Bid', stepResults: ['❌ Failed to submit bid'] });
      }
    }
  }

  // Create Dispute
  if (tokens.pmToken) {
    const createDispute = await checkEndpoint('Create Dispute', 'POST', '/disputes', tokens.pmToken, {
      title: 'Smoke Test Dispute',
      description: 'Test dispute created during smoke test',
      type: 'payment'
    });

    if (createDispute.success && createDispute.data?.id) {
      const disputeId = createDispute.data.id;
      flows.push({ flowName: 'Create Dispute', stepResults: ['✅ Dispute created', `Dispute ID: ${disputeId}`] });
      
      // Get dispute details
      await checkEndpoint('Get Dispute Details', 'GET', `/disputes/${disputeId}`, tokens.pmToken);
    } else {
      flows.push({ flowName: 'Create Dispute', stepResults: ['❌ Failed to create dispute'] });
    }
  }

  report.actionFlows = flows;
}

// 6. Error & 404 Audit
async function errorAudit() {
  log('🔍 Auditing Error Responses...');
  
  const known404Endpoints = [
    '/disputes',
    '/admin/logs'
  ];

  for (const endpoint of known404Endpoints) {
    const result = await checkEndpoint(`404 Audit: ${endpoint}`, 'GET', endpoint);
    if (result.result.status === 404) {
      report.notes.push(`Endpoint ${endpoint} returned 404 - verify if this is expected`);
    }
  }
}

// Main execution
async function runSmokeTest() {
  log('🚀 Starting BidRoom Smoke Test & Release Check...');
  log(`📡 API Base URL: ${API_BASE}`);
  log(`🏥 Health Check: ${HEALTH_CHECK}`);
  
  try {
    // 1. Health Checks
    const healthOk = await healthChecks();
    if (!healthOk) {
      report.readiness = 'BLOCKED';
      report.recommendedFixes.push('Backend server is not accessible - check if server is running');
      generateReport();
      return;
    }

    // 2. Auth & Session
    const tokens = await authTests();
    
    // 3. Core Endpoints
    await coreEndpointsSmoke(tokens);
    
    // 4. Admin Endpoints
    await adminEndpoints(tokens.adminToken);
    
    // 5. Action Flows
    await actionFlows(tokens);
    
    // 6. Error Audit
    await errorAudit();

    // Determine readiness
    const failedEndpoints = report.endpointsChecked.filter(e => !e.ok && e.status >= 500);
    const criticalFailures = report.criticalErrors.length > 0;
    
    if (criticalFailures) {
      report.readiness = 'BLOCKED';
      report.recommendedFixes.push('Critical errors detected - see criticalErrors array');
    } else if (failedEndpoints.length > 0) {
      report.readiness = 'HOLD';
      report.recommendedFixes.push(`${failedEndpoints.length} endpoint(s) failed - review endpointsChecked`);
    } else {
      report.readiness = 'GO';
    }

    generateReport();
    
  } catch (error) {
    log(`❌ Smoke test failed with error: ${error.message}`);
    report.criticalErrors.push({ error: error.message, stack: error.stack });
    report.readiness = 'BLOCKED';
    generateReport();
  }
}

function generateReport() {
  const reportPath = path.join(__dirname, '../SMOKE_TEST_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📄 Report saved to: ${reportPath}`);
  
  // Also output summary
  console.log('\n' + '='.repeat(60));
  console.log('SMOKE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Health: ${report.health ? '✅' : '❌'}`);
  console.log(`Endpoints Checked: ${report.endpointsChecked.length}`);
  console.log(`Failed Endpoints: ${report.endpointsChecked.filter(e => !e.ok).length}`);
  console.log(`Critical Errors: ${report.criticalErrors.length}`);
  console.log(`Readiness: ${report.readiness}`);
  console.log('='.repeat(60));
  
  if (report.criticalErrors.length > 0) {
    console.log('\n🚨 CRITICAL ERRORS:');
    report.criticalErrors.forEach(err => {
      console.log(`  - ${err.endpoint || 'Unknown'}: ${err.error}`);
    });
  }
  
  if (report.recommendedFixes.length > 0) {
    console.log('\n💡 RECOMMENDED FIXES:');
    report.recommendedFixes.forEach(fix => {
      console.log(`  - ${fix}`);
    });
  }
}

// Run the test
runSmokeTest().catch(console.error);

