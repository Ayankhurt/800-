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
  deleteJob,

  // Bids Management
  getAllBids,

  // Financial Management
  getFinancialStats,
  getAllTransactions,
  getTransactionDetails,
  refundTransaction,
  cancelTransaction,

  // Disputes Management
  getAllDisputes,



  // Verification Management
  getAllVerificationRequests,
  getVerificationStats,
  getVerificationDetails,
  approveVerification,
  rejectVerification,

  // Content Moderation
  getAllReports,
  resolveReport,

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
  approvePayout,
  holdPayout,
  resendFailedPayout,
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
  getEscrowDetails,
  releaseEscrowPayment,
  freezeEscrowAccount,
  unfreezeEscrowAccount,
  refundEscrowToOwner,
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  sendNotificationToUser,
  broadcastNotification,
  bulkVerifyUsers,
  bulkSuspendUsers,
  bulkDeleteUsers,
  getProjectsDashboard
} from "../controllers/adminController.js";

import { supportController } from "../controllers/supportController.js";

// Import audit logs functions
import { getAuditLogs, getAdminLogs } from "../controllers/auditLogsController.js";

// Import jobs admin functions
import {
  getJobDetails,
  getJobApplications,
  getJobTimeline,
  getJobAppointments,
  getAllBidsForAdmin,
  getBidDetails,
  updateBid,
  cancelBid,
  closeBid,
  updateJob,
  updateJobStatus,
  updateJobDeadline,
  updateJobFeature,
  flagJob,
  contactJobPoster,
  addJobAdminNote
} from "../controllers/jobsAdminController.js";

// Import notification functions
import { sendBulkNotifications } from "../controllers/notificationController.js";

// Import admin user management functions
import {
  getAllAdminUsers as getAdminUsersList,
  createAdminUser as createNewAdminUser,
  updateAdminUser as updateExistingAdminUser,
  deleteAdminUser as deleteExistingAdminUser
} from "../controllers/adminUserController.js";

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

// Admin Users (new controller)
router.get("/admin-users", requireSuperAdmin, getAdminUsersList);
router.post("/admin-users", requireSuperAdmin, createNewAdminUser);
router.put("/admin-users/:id", requireSuperAdmin, updateExistingAdminUser);
router.delete("/admin-users/:id", requireSuperAdmin, deleteExistingAdminUser);

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
router.post("/verify-user", adminVerifyUser);
router.post("/users/bulk-verify", bulkVerifyUsers);
router.post("/users/bulk-suspend", bulkSuspendUsers);
router.post("/users/bulk-delete", requireSuperAdmin, bulkDeleteUsers);
router.post("/users/:id/notify", sendNotificationToUser);
router.post("/notifications/broadcast", broadcastNotification); // Broadcast to all or role
router.post("/notifications/bulk", sendBulkNotifications); // Send to specific list
router.get("/users/:id/sessions", getUserSessions);

// ==================== PROJECTS MANAGEMENT ====================
router.get("/projects", getAllProjects);
router.get("/projects/dashboard", getProjectsDashboard);
router.get("/projects/:id", getProjectById);

// ==================== JOBS MANAGEMENT ====================
router.get("/jobs", getAllJobs);
router.delete("/jobs/:id", deleteJob);
router.get("/jobs/:id", getJobDetails);
router.get("/jobs/:id/applications", getJobApplications);
router.get("/jobs/:id/timeline", getJobTimeline);
router.get("/jobs/:id/appointments", getJobAppointments);
router.put("/jobs/:id", updateJob);
router.put("/jobs/:id/status", updateJobStatus);
router.put("/jobs/:id/deadline", updateJobDeadline);
router.put("/jobs/:id/feature", updateJobFeature);
router.post("/jobs/:id/flag", flagJob);
router.post("/jobs/:id/contact", contactJobPoster);
router.post("/jobs/:id/notes", addJobAdminNote);

// ==================== BIDS MANAGEMENT ====================
router.get("/bids", getAllBidsForAdmin);
router.get("/bids/:id", getBidDetails);
router.put("/bids/:id", updateBid);
router.put("/bids/:id/close", closeBid);
router.post("/bids/:id/cancel", cancelBid);

// ==================== FINANCIAL MANAGEMENT ====================
router.get("/financial/stats", getFinancialStats);
router.get("/financial/escrow", getAllEscrowAccounts);
router.get("/financial/escrow/:id", getEscrowDetails);
router.post("/financial/escrow/:id/release", releaseEscrowPayment);
router.post("/financial/escrow/:id/freeze", freezeEscrowAccount);
router.post("/financial/escrow/:id/unfreeze", unfreezeEscrowAccount);
router.post("/financial/escrow/:id/refund", refundEscrowToOwner);
router.get("/transactions", getAllTransactions);
router.get("/transactions/:id", getTransactionDetails);
router.post("/transactions/:id/refund", refundTransaction);
router.post("/transactions/:id/cancel", cancelTransaction);

// ==================== DISPUTES MANAGEMENT ====================

router.get("/disputes", getAllDisputes);

// ==================== SUPPORT & TICKETS ====================
router.get("/support/tickets", supportController.getAllTickets);
router.get("/support/tickets/:id", supportController.getTicketById);
router.post("/support/tickets/:id/reply", supportController.replyToTicket);
router.post("/support/tickets/:id/notes", supportController.addTicketNote);
router.put("/support/tickets/:id", supportController.updateTicket); // Changed from /update to / to match RESTful convention if desired, but sticking to instruction
router.put("/support/tickets/:id/update", supportController.updateTicket);
router.post("/support/tickets/:id/close", supportController.closeTicket);
router.post("/support/tickets/:id/reopen", supportController.reopenTicket);

// ==================== VERIFICATION MANAGEMENT ====================
router.get("/verifications/stats", getVerificationStats);
router.get("/verifications/:id", getVerificationDetails);
router.post("/verifications/:id/approve", approveVerification);
router.post("/verifications/:id/reject", rejectVerification);
router.get("/verifications", getAllVerificationRequests);

// ==================== CONTENT MODERATION ====================
router.get("/moderation/reports", getAllReports);
router.post("/moderation/reports/:id/resolve", resolveReport);

// ==================== ANALYTICS ====================
router.get("/analytics", getAnalytics);

// ==================== SYSTEM SETTINGS ====================
router.get("/settings", requireSuperAdmin, getSystemSettings); // Protected
router.post("/settings", requireSuperAdmin, updateSystemSetting); // Protected

// ==================== AUDIT LOGS ====================
router.get("/audit-logs", getAuditLogs); // Protected by general admin middleware
router.get("/audit-logs/compliance", getAuditLogs); // Stub reuse for compliance
router.get("/logs", getAdminLogs); // Admin activity logs for dashboard

// ==================== REFERRAL PROGRAM (Disabled for MVP) ====================
// router.get("/referrals/stats", getReferralStats);

// ==================== PAYOUTS MANAGEMENT ====================
router.get("/payouts", getAllPayouts);
router.post("/payouts/:id/process", processPayout);
router.post("/payouts/:id/approve", approvePayout);
router.post("/payouts/:id/hold", holdPayout);
router.post("/payouts/:id/resend", resendFailedPayout);

// ==================== REVIEWS MANAGEMENT ====================
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

// ==================== MESSAGES (MODERATION) ====================
router.get("/messages", getAllMessages);

// ==================== ANNOUNCEMENTS (Disabled for MVP) ====================
// router.get("/announcements", getAllAnnouncements);
// router.post("/announcements", createAnnouncement);
// router.delete("/announcements/:id", deleteAnnouncement);

// ==================== BADGES MANAGEMENT (Disabled for MVP) ====================
// router.get("/badges", getAllBadges);
// router.post("/badges", createBadge);

// ==================== APPOINTMENTS ====================
router.get("/appointments", getAllAppointments);

// ==================== LOGIN & SECURITY ====================
router.get("/login/logs", requireSuperAdmin, getLoginLogs); // Protected
router.get("/login/stats", requireSuperAdmin, getLoginStats); // Protected

export default router;