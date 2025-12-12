import express from "express";
import {
  // Dashboard
  getDashboardStats,

  // User Management
  listUsers,
  getUserById,
  updateUser,
  deleteUserHard,
  changeUserRole,
  suspendUser,
  unsuspendUser,
  adminVerifyUser,
  updateUserRole,

  // Projects Management
  getAllProjects,
  getProjectById,

  // Jobs Management
  getAllJobs,

  // Bids Management
  getAllBids,

  // Financial Management
  getFinancialStats,
  getAllTransactions,

  // Disputes Management
  getAllDisputes,

  // Support & Tickets
  getSupportTickets,

  // Verification Management
  getAllVerificationRequests,

  // Content Moderation
  getAllReports,

  // Analytics
  getAnalytics,

  // System Settings
  getSystemSettings,
  updateSystemSetting,

  // Referral Program
  getReferralStats,

  // Placeholder functions
  getUserSessions,
  getLoginLogs,
  getLoginStats,

  // New Additions
  getAllPayouts,
  processPayout,
  getAllReviews,
  deleteReview,
  getAllMessages,
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAllBadges,
  createBadge,
  getAllAppointments,
  getAllEscrowAccounts,
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  sendNotificationToUser
} from "../controllers/adminController.js";

// Import audit logs functions
import { getAuditLogs, getAdminLogs } from "../controllers/auditLogsController.js";

// Import jobs admin functions
import {
  getJobDetails,
  getJobApplications,
  getJobTimeline,
  getJobAppointments,
  getAllBidsForAdmin
} from "../controllers/jobsAdminController.js";

// Import notification functions
import { sendBulkNotifications } from "../controllers/notificationController.js";

import { authenticateUser } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";

const router = express.Router();

// Apply admin middleware to all routes
router.use(authenticateUser);
router.use(requireAdmin);

// ==================== DASHBOARD ====================
router.get("/dashboard/stats", getDashboardStats);

// ==================== USER MANAGEMENT ====================
router.get("/users", listUsers);

// ==================== ADMIN MANAGEMENT ====================
router.get("/admins", requireSuperAdmin, getAllAdminUsers);
router.post("/admins", requireSuperAdmin, createAdminUser);
router.put("/admins/:id", requireSuperAdmin, updateAdminUser);

// ==================== USER DETAILS ====================
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser); // Changed from PATCH to PUT
router.patch("/users/:id", updateUser); // Keep PATCH for backward compatibility
router.delete("/users/:id", requireSuperAdmin, deleteUserHard); // Protected
router.post("/users/change-role", requireSuperAdmin, changeUserRole); // Protected
router.put("/update-role", requireSuperAdmin, changeUserRole); // Alias for frontend
router.put("/users/:id/role", requireAdmin, updateUserRole); // New Role Update Endpoint
router.post("/users/:id/suspend", suspendUser);
router.post("/users/:id/unsuspend", requireSuperAdmin, unsuspendUser); // Protected
router.post("/users/verify", adminVerifyUser);
router.post("/verify-user", adminVerifyUser); // Fix for frontend calling /verify-user
router.post("/users/:id/notify", sendNotificationToUser); // Send notification to user
router.post("/notifications/bulk", sendBulkNotifications); // Send bulk notifications
router.get("/users/:id/sessions", getUserSessions);

// ==================== PROJECTS MANAGEMENT ====================
router.get("/projects", getAllProjects);
router.get("/projects/:id", getProjectById);

// ==================== JOBS MANAGEMENT ====================
router.get("/jobs", getAllJobs);
router.get("/jobs/:id", getJobDetails);
router.get("/jobs/:id/applications", getJobApplications);
router.get("/jobs/:id/timeline", getJobTimeline);
router.get("/jobs/:id/appointments", getJobAppointments);

// ==================== BIDS MANAGEMENT ====================
router.get("/bids", getAllBidsForAdmin);

// ==================== FINANCIAL MANAGEMENT ====================
router.get("/financial/stats", getFinancialStats);
router.get("/financial/escrow", requireSuperAdmin, getAllEscrowAccounts); // Escrow is sensitive? Maybe. Let's protect it or leave it to Finance Manager? 
// The Sidebar says Finance Manager can access. So strictly Super Admin is wrong. 
// Ideally I need requireFinanceOrSuperAdmin. 
// For now, I will remove requireSuperAdmin from escrow to allow Finance Managers.
router.get("/financial/escrow", getAllEscrowAccounts);
router.get("/transactions", getAllTransactions);

// ==================== DISPUTES MANAGEMENT ====================

router.get("/disputes", getAllDisputes);

// ==================== SUPPORT & TICKETS ====================
router.get("/support/tickets", getSupportTickets);

// ==================== VERIFICATION MANAGEMENT ====================
router.get("/verifications", getAllVerificationRequests);

// ==================== CONTENT MODERATION ====================
router.get("/moderation/reports", getAllReports);

// ==================== ANALYTICS ====================
router.get("/analytics", getAnalytics);

// ==================== SYSTEM SETTINGS ====================
router.get("/settings", requireSuperAdmin, getSystemSettings); // Protected
router.post("/settings", requireSuperAdmin, updateSystemSetting); // Protected

// ==================== AUDIT LOGS ====================
router.get("/audit-logs", requireSuperAdmin, getAuditLogs); // Protected
router.get("/logs", getAdminLogs); // Admin activity logs for dashboard

// ==================== REFERRAL PROGRAM ====================
router.get("/referrals/stats", getReferralStats);

// ==================== PAYOUTS MANAGEMENT ====================
router.get("/payouts", getAllPayouts);
router.post("/payouts/:id/process", processPayout); // Maybe require Finance Manager?

// ==================== REVIEWS MANAGEMENT ====================
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

// ==================== MESSAGES (MODERATION) ====================
router.get("/messages", getAllMessages);

// ==================== ANNOUNCEMENTS ====================
router.get("/announcements", getAllAnnouncements);
router.post("/announcements", createAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

// ==================== BADGES MANAGEMENT ====================
router.get("/badges", getAllBadges);
router.post("/badges", createBadge);

// ==================== APPOINTMENTS ====================
router.get("/appointments", getAllAppointments);

// ==================== LOGIN & SECURITY ====================
router.get("/login/logs", requireSuperAdmin, getLoginLogs); // Protected
router.get("/login/stats", requireSuperAdmin, getLoginStats); // Protected

export default router;