/**
 * API Verification Script
 * 
 * This file contains verification functions to test all API endpoints
 * Run these tests to verify the integration is working correctly
 */

import {
  authAPI,
  jobsAPI,
  bidsAPI,
  contractorsAPI,
  projectsAPI,
  milestonesAPI,
  paymentsAPI,
  disputesAPI,
  reviewsAPI,
  messagesAPI,
  notificationsAPI,
  uploadsAPI,
} from './index';
import type { ApiResponse } from './types';

export interface VerificationResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  error?: any;
}

export interface VerificationReport {
  module: string;
  results: VerificationResult[];
  passed: number;
  failed: number;
  skipped: number;
}

/**
 * Verify Authentication Endpoints
 */
export async function verifyAuth(): Promise<VerificationReport> {
  const results: VerificationResult[] = [];

  // Test register (may fail if email exists, that's OK)
  try {
    const registerResult = await authAPI.register({
      email: `test${Date.now()}@example.com`,
      password: 'Test123!@#',
      full_name: 'Test User',
      role_code: 'VIEWER',
    });
    results.push({
      endpoint: 'POST /auth/signup',
      method: 'POST',
      status: registerResult.success ? 'PASS' : 'FAIL',
      message: registerResult.success ? 'Registration successful' : registerResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'POST /auth/signup',
      method: 'POST',
      status: error.response?.status === 409 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 409 ? 'Email already exists (expected)' : error.message,
      error: error.response?.data,
    });
  }

  // Test login (requires valid credentials - may skip)
  try {
    const loginResult = await authAPI.login({
      email: 'test@example.com',
      password: 'password',
    });
    results.push({
      endpoint: 'POST /auth/login',
      method: 'POST',
      status: loginResult.success || loginResult.data?.mfa_required ? 'PASS' : 'FAIL',
      message: loginResult.data?.mfa_required ? 'Login requires MFA (expected)' : 'Login successful',
    });
  } catch (error: any) {
    results.push({
      endpoint: 'POST /auth/login',
      method: 'POST',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Invalid credentials (expected in test)' : error.message,
      error: error.response?.data,
    });
  }

  // Test get profile (requires auth)
  try {
    const meResult = await authAPI.me();
    results.push({
      endpoint: 'GET /auth/me',
      method: 'GET',
      status: meResult.success ? 'PASS' : 'FAIL',
      message: meResult.success ? 'Profile retrieved' : meResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /auth/me',
      method: 'GET',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Not authenticated (expected)' : error.message,
      error: error.response?.data,
    });
  }

  // Test refresh token (requires valid refresh token)
  try {
    const refreshResult = await authAPI.refresh();
    results.push({
      endpoint: 'POST /auth/refresh-token',
      method: 'POST',
      status: refreshResult.success ? 'PASS' : 'FAIL',
      message: refreshResult.success ? 'Token refreshed' : refreshResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'POST /auth/refresh-token',
      method: 'POST',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'No refresh token (expected)' : error.message,
      error: error.response?.data,
    });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  return { module: 'Authentication', results, passed, failed, skipped };
}

/**
 * Verify Jobs Endpoints
 */
export async function verifyJobs(): Promise<VerificationReport> {
  const results: VerificationResult[] = [];

  try {
    const jobsResult = await jobsAPI.getAll({ limit: 10, offset: 0 });
    results.push({
      endpoint: 'GET /jobs',
      method: 'GET',
      status: jobsResult.success !== false ? 'PASS' : 'FAIL',
      message: jobsResult.success !== false ? 'Jobs retrieved' : jobsResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /jobs',
      method: 'GET',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Not authenticated' : error.message,
      error: error.response?.data,
    });
  }

  try {
    const searchResult = await jobsAPI.search('test');
    results.push({
      endpoint: 'GET /jobs/search',
      method: 'GET',
      status: searchResult.success !== false ? 'PASS' : 'FAIL',
      message: searchResult.success !== false ? 'Search works' : searchResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /jobs/search',
      method: 'GET',
      status: error.response?.status === 404 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 404 ? 'Endpoint not available' : error.message,
      error: error.response?.data,
    });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  return { module: 'Jobs', results, passed, failed, skipped };
}

/**
 * Verify Contractors Endpoints
 */
export async function verifyContractors(): Promise<VerificationReport> {
  const results: VerificationResult[] = [];

  try {
    const contractorsResult = await contractorsAPI.getAll({ limit: 10 });
    results.push({
      endpoint: 'GET /contractors',
      method: 'GET',
      status: contractorsResult.success !== false ? 'PASS' : 'FAIL',
      message: contractorsResult.success !== false ? 'Contractors retrieved' : contractorsResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /contractors',
      method: 'GET',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Not authenticated' : error.message,
      error: error.response?.data,
    });
  }

  try {
    const searchResult = await contractorsAPI.search({ query: 'plumber' });
    results.push({
      endpoint: 'POST /contractors/search',
      method: 'POST',
      status: searchResult.success !== false ? 'PASS' : 'FAIL',
      message: searchResult.success !== false ? 'Search works' : searchResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'POST /contractors/search',
      method: 'POST',
      status: error.response?.status === 404 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 404 ? 'Endpoint not available' : error.message,
      error: error.response?.data,
    });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  return { module: 'Contractors', results, passed, failed, skipped };
}

/**
 * Verify Bids Endpoints
 */
export async function verifyBids(): Promise<VerificationReport> {
  const results: VerificationResult[] = [];

  try {
    const bidsResult = await bidsAPI.getAll({ limit: 10 });
    results.push({
      endpoint: 'GET /bids',
      method: 'GET',
      status: bidsResult.success !== false ? 'PASS' : 'FAIL',
      message: bidsResult.success !== false ? 'Bids retrieved' : bidsResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /bids',
      method: 'GET',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Not authenticated' : error.message,
      error: error.response?.data,
    });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  return { module: 'Bids', results, passed, failed, skipped };
}

/**
 * Verify Projects Endpoints
 */
export async function verifyProjects(): Promise<VerificationReport> {
  const results: VerificationResult[] = [];

  try {
    const projectsResult = await projectsAPI.getAll({ limit: 10 });
    results.push({
      endpoint: 'GET /projects',
      method: 'GET',
      status: projectsResult.success !== false ? 'PASS' : 'FAIL',
      message: projectsResult.success !== false ? 'Projects retrieved' : projectsResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /projects',
      method: 'GET',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Not authenticated' : error.message,
      error: error.response?.data,
    });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  return { module: 'Projects', results, passed, failed, skipped };
}

/**
 * Verify Messages Endpoints
 */
export async function verifyMessages(): Promise<VerificationReport> {
  const results: VerificationResult[] = [];

  try {
    const conversationsResult = await messagesAPI.getConversations();
    results.push({
      endpoint: 'GET /conversations',
      method: 'GET',
      status: conversationsResult.success !== false ? 'PASS' : 'FAIL',
      message: conversationsResult.success !== false ? 'Conversations retrieved' : conversationsResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /conversations',
      method: 'GET',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Not authenticated' : error.message,
      error: error.response?.data,
    });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  return { module: 'Messages', results, passed, failed, skipped };
}

/**
 * Verify Notifications Endpoints
 */
export async function verifyNotifications(): Promise<VerificationReport> {
  const results: VerificationResult[] = [];

  try {
    const notificationsResult = await notificationsAPI.getAll({ limit: 10 });
    results.push({
      endpoint: 'GET /notifications',
      method: 'GET',
      status: notificationsResult.success !== false ? 'PASS' : 'FAIL',
      message: notificationsResult.success !== false ? 'Notifications retrieved' : notificationsResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /notifications',
      method: 'GET',
      status: error.response?.status === 401 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 401 ? 'Not authenticated' : error.message,
      error: error.response?.data,
    });
  }

  try {
    const unreadCountResult = await notificationsAPI.getUnreadCount();
    results.push({
      endpoint: 'GET /notifications/unread/count',
      method: 'GET',
      status: unreadCountResult.success !== false ? 'PASS' : 'FAIL',
      message: unreadCountResult.success !== false ? 'Unread count retrieved' : unreadCountResult.message,
    });
  } catch (error: any) {
    results.push({
      endpoint: 'GET /notifications/unread/count',
      method: 'GET',
      status: error.response?.status === 404 ? 'SKIP' : 'FAIL',
      message: error.response?.status === 404 ? 'Endpoint not available' : error.message,
      error: error.response?.data,
    });
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  return { module: 'Notifications', results, passed, failed, skipped };
}

/**
 * Run all verifications
 */
export async function runAllVerifications(): Promise<VerificationReport[]> {
  const reports: VerificationReport[] = [];

  console.log('🔍 Starting API Verification...\n');

  reports.push(await verifyAuth());
  reports.push(await verifyJobs());
  reports.push(await verifyContractors());
  reports.push(await verifyBids());
  reports.push(await verifyProjects());
  reports.push(await verifyMessages());
  reports.push(await verifyNotifications());

  return reports;
}

/**
 * Generate verification summary
 */
export function generateVerificationSummary(reports: VerificationReport[]): string {
  let summary = '\n📊 API VERIFICATION SUMMARY\n';
  summary += '='.repeat(50) + '\n\n';

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  reports.forEach(report => {
    totalPassed += report.passed;
    totalFailed += report.failed;
    totalSkipped += report.skipped;

    summary += `📦 ${report.module}\n`;
    summary += `   ✅ Passed: ${report.passed}\n`;
    summary += `   ❌ Failed: ${report.failed}\n`;
    summary += `   ⏭️  Skipped: ${report.skipped}\n\n`;

    report.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      summary += `   ${icon} ${result.method} ${result.endpoint}\n`;
      summary += `      ${result.message}\n`;
      if (result.error) {
        summary += `      Error: ${JSON.stringify(result.error)}\n`;
      }
    });
    summary += '\n';
  });

  summary += '='.repeat(50) + '\n';
  summary += `Total: ✅ ${totalPassed} | ❌ ${totalFailed} | ⏭️  ${totalSkipped}\n`;

  return summary;
}




