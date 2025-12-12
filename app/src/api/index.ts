/**
 * BidRoom API - Complete Integration
 * 
 * This module exports all API services organized by feature.
 * All APIs use the axios client with automatic token refresh on 401.
 * 
 * Usage:
 * ```typescript
 * import { authAPI, jobsAPI, bidsAPI } from '@/src/api';
 * 
 * // Login
 * const result = await authAPI.login({ email, password });
 * 
 * // Get jobs
 * const jobs = await jobsAPI.getAll({ limit: 20, offset: 0 });
 * ```
 */

// Core client (axios instance with interceptors)
export { default as apiClient, setAccessToken, setRefreshToken, clearTokens, getAccessToken, getRefreshToken, BASE_URL } from "./client";

// API Services
export { default as authAPI } from "./auth";
export { default as jobsAPI } from "./jobs";
export { default as bidsAPI } from "./bids";
export { default as contractorsAPI } from "./contractors";
export { default as projectsAPI } from "./projects";
export { default as milestonesAPI } from "./milestones";
export { default as paymentsAPI } from "./payments";
export { default as disputesAPI } from "./disputes";
export { default as reviewsAPI } from "./reviews";
export { default as messagesAPI } from "./messages";
export { default as notificationsAPI } from "./notifications";
export { default as uploadsAPI } from "./uploads";

// Types
export * from "./types";




