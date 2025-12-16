import apiClient from './axios';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
  rating?: number;
  is_active?: boolean;
  verification_status?: string;
  company_name?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  budget?: number;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  trade_type?: string;
  created_at: string;
  deadline?: string;
  end_date?: string;
  featured?: boolean;
  posted_by?: User;
  project_manager_id?: string;
  applications_count?: number;
  application_count?: number;
}

export interface Application {
  id: string;
  job_id: string;
  contractor_id: string;
  status: string;
  bid_amount?: number;
  proposal?: string;
  created_at: string;
  contractor?: User;
}

export interface TimelineItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  created_at: string;
  created_by?: User;
}

export interface Bid {
  id: string;
  job_id: string;
  contractor_id: string;
  status: string;
  amount?: number;
  budget?: number;
  deadline?: string;
  title?: string;
  description?: string;
  trade_type?: string;
  proposal?: string;
  created_at: string;
  job?: Job;
  contractor?: User;
  created_by?: User;
  submissions?: any[];
}

export interface Appointment {
  id: string;
  job_id: string;
  scheduled_at: string;
  status: string;
  location?: string;
  client?: User;
  contractor?: User;
}

export interface AdminNote {
  id: string;
  content: string;
  created_at: string;
  created_by?: User;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  total_amount: number;
  budget: number; // For backward compatibility/frontend expectation
  completion_percentage: number;
  start_date: string;
  end_date?: string;
  owner_id: string;
  contractor_id: string;
  owner?: User;
  contractor?: User;
  dispute_count: number;
  created_at: string;
}

export interface ProjectsDashboard {
  active_projects_count: number;
  average_completion_time: number;
  on_time_completion_rate: number;
  dispute_rate: number;
  payment_release_stats: {
    total_released: number;
    total_pending: number;
  };
  projects_by_status: {
    setup: number;
    active: number;
    completed: number;
    disputed: number;
    cancelled: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: string;
  role_code: string;
  status: string;
  verification_status: string;
  is_active: boolean;
  trust_score?: number;
  last_login_at?: string;
  email_verified?: boolean;
  phone?: string;
  company_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface FinancialMetrics {
  totalVolume: number;
  platformFees: number;
  escrowBalance: number;
  pendingPayouts: number;
  failedPayments: number;
  refundsProcessed: number;
  averageTransactionSize: number;
  paymentSuccessRate: number;
  monthlyVolume?: number;
  weeklyVolume?: number;
  dailyVolume?: number;
  activeEscrowAccounts?: number;
  pendingPayments?: number;
}

export interface EscrowAccount {
  id: string;
  project_id: string;
  total_amount: number;
  released_amount: number;
  remaining_balance: number;
  status: 'active' | 'frozen' | 'closed' | 'disputed';
  owner: User;
  contractor: User;
  project?: {
    id: string;
    title: string;
    owner: User | null;
    contractor: User | null;
  };
  created_at: string;
  frozen_amount?: number;
  milestones?: {
    id: string;
    name: string;
    amount: number;
    status: string;
    scheduled_release_date?: string;
    released_at?: string;
  }[];
  transaction_history?: {
    id: string;
    type: string;
    amount: number;
    status: string;
    initiated_at: string;
  }[];
}

export interface Payout {
  id: string;
  contractor_id: string;
  contractor: User;
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'held';
  bank_account?: {
    account_number: string;
    routing_number: string;
    bank_name: string;
    account_type: string;
    verified: boolean;
  };
  scheduled_date?: string;
  processed_at?: string;
  created_at: string;
  project_id?: string;
  failure_reason?: string;
  hold_reason?: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  user: {
    full_name: string;
    email: string;
  };
  assigned_to?: {
    full_name: string;
  };
  conversation_history?: SupportTicketMessage[];
  internal_notes?: any[];
  first_response_at?: string;
  resolved_at?: string;
}

export interface SupportTicketMessage {
  id: string;
  is_internal: boolean;
  sender: {
    type: 'user' | 'admin';
    user?: { full_name: string; email: string };
    full_name?: string;
  };
  message: string;
  created_at: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
}

export interface ModerationQueueItem {
  id: string;
  content_type: string;
  content_id: string;
  reported_by: User;
  report_reason: string;
  report_details?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  assigned_to?: User;
  reported_at: string;
  reviewed_at?: string;
  reviewed_by?: User;
  action_taken?: string;
  admin_notes?: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  type: 'deposit' | 'payment' | 'refund' | 'payout' | 'fee';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  amount: number;
  currency: string;
  sender_id: string;
  receiver_id: string;
  project_id?: string;
  milestone_id?: string;
  payer?: User;
  payee?: User;
  description?: string;
  payment_method?: string;
  receipt_url?: string;
  initiated_at: string;
  completed_at?: string;
  failed_at?: string;
  failure_reason?: string;
  fees: {
    platform_fee: number;
    processing_fee: number;
    total_fees: number;
  };
  metadata?: any;
  status_history?: {
    status: string;
    timestamp: string;
    reason?: string;
    updated_by?: User;
  }[];
  related_transactions?: string[];
}

export const adminService = {
  // Get Dashboard Stats
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  // List All Users
  listUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    verification_status?: string;
  }) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  // Get User By ID
  getUserById: async (user_id: string) => {
    const response = await apiClient.get(`/admin/users/${user_id}`);
    return response.data;
  },

  // Update User
  updateUser: async (user_id: string, data: any) => {
    const response = await apiClient.put(`/admin/users/${user_id}`, data);
    return response.data;
  },

  // Update User Role
  updateUserRole: async (user_id: string, role: string) => {
    const response = await apiClient.put(`/admin/users/${user_id}/role`, { role });
    return response.data;
  },

  // Suspend User
  suspendUser: async (user_id: string) => {
    const response = await apiClient.post(`/admin/users/${user_id}/suspend`);
    return response.data;
  },

  // Unsuspend User
  unsuspendUser: async (user_id: string) => {
    const response = await apiClient.post(`/admin/users/${user_id}/unsuspend`);
    return response.data;
  },

  // Delete User (Hard Delete)
  deleteUser: async (user_id: string) => {
    const response = await apiClient.delete(`/admin/users/${user_id}`);
    return response.data;
  },

  // Verify User
  verifyUser: async (user_id: string) => {
    const response = await apiClient.post('/admin/verify-user', { user_id });
    return response.data;
  },

  // Create User
  createUser: async (data: {
    full_name: string;
    email: string;
    password: string;
    role_code: string;
    phone?: string;
    company_name?: string;
  }) => {
    const response = await apiClient.post('/auth/admin/create-user', data);
    return response.data;
  },

  // Get All Users (alias for listUsers)
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    verification_status?: string;
  }) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  // Get All Roles
  getAllRoles: async () => {
    const response = await apiClient.get('/admin/roles');
    return response.data;
  },

  // ========== ADMIN USER MANAGEMENT ==========

  // Get All Admin Users
  getAllAdminUsers: async (params?: {
    role?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/admin-users', { params });
    return response.data;
  },

  // Create Admin User
  createAdminUser: async (data: {
    email: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
    require_2fa?: boolean;
    permissions?: string[];
    ip_whitelist?: string[];
  }) => {
    const response = await apiClient.post('/admin/admin-users', data);
    return response.data;
  },

  // Update Admin User
  updateAdminUser: async (admin_id: string, data: {
    role?: string;
    permissions?: string[];
    require_2fa?: boolean;
    ip_whitelist?: string[];
    is_active?: boolean;
  }) => {
    const response = await apiClient.put(`/admin/admin-users/${admin_id}`, data);
    return response.data;
  },

  // Delete Admin User
  deleteAdminUser: async (admin_id: string) => {
    const response = await apiClient.delete(`/admin/admin-users/${admin_id}`);
    return response.data;
  },

  // ========== PROJECTS MANAGEMENT (CORE) ==========

  // Get Projects Dashboard Stats
  getProjectsDashboard: async () => {
    const response = await apiClient.get('/admin/projects/dashboard');
    return response.data;
  },

  // Get All Projects
  getAllProjects: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/projects', { params });
    return response.data;
  },

  // Get Project By ID
  getProjectById: async (project_id: string) => {
    const response = await apiClient.get(`/admin/projects/${project_id}`);
    return response.data;
  },

  // ========== JOBS MANAGEMENT (CORE) ==========

  // Get All Jobs
  getAllJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/jobs', { params });
    return response.data;
  },

  // Get Job Details
  getJobDetails: async (job_id: string) => {
    const response = await apiClient.get(`/admin/jobs/${job_id}`);
    return response.data;
  },

  // Delete Job
  deleteJob: async (job_id: string) => {
    const response = await apiClient.delete(`/admin/jobs/${job_id}`);
    return response.data;
  },

  // Update Job
  updateJob: async (job_id: string, data: any) => {
    const response = await apiClient.put(`/admin/jobs/${job_id}`, data);
    return response.data;
  },

  // Change Job Status
  changeJobStatus: async (job_id: string, status: string) => {
    const response = await apiClient.put(`/admin/jobs/${job_id}/status`, { status });
    return response.data;
  },

  // Extend Job Deadline
  extendJobDeadline: async (job_id: string, deadline: string) => {
    const response = await apiClient.put(`/admin/jobs/${job_id}/deadline`, { deadline });
    return response.data;
  },

  // Feature Job
  featureJob: async (job_id: string, featured: boolean) => {
    const response = await apiClient.put(`/admin/jobs/${job_id}/feature`, { featured });
    return response.data;
  },

  // Flag Job
  flagJob: async (job_id: string, reason: string) => {
    const response = await apiClient.post(`/admin/jobs/${job_id}/flag`, { reason });
    return response.data;
  },

  // Get Job Timeline
  getJobTimeline: async (job_id: string) => {
    const response = await apiClient.get(`/admin/jobs/${job_id}/timeline`);
    return response.data;
  },

  // Get Job Applications
  getJobApplications: async (job_id: string) => {
    const response = await apiClient.get(`/admin/jobs/${job_id}/applications`);
    return response.data;
  },

  // Get Job Appointments
  getJobAppointments: async (job_id: string) => {
    const response = await apiClient.get(`/admin/jobs/${job_id}/appointments`);
    return response.data;
  },

  // Contact Job Poster
  contactJobPoster: async (job_id: string, message: string) => {
    const response = await apiClient.post(`/admin/jobs/${job_id}/contact`, { message });
    return response.data;
  },

  // Add Admin Note
  addJobAdminNote: async (job_id: string, note: string) => {
    const response = await apiClient.post(`/admin/jobs/${job_id}/notes`, { note });
    return response.data;
  },

  // ========== BIDS MANAGEMENT (CORE) ==========

  // Get All Bids
  getAllBids: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/bids', { params });
    return response.data;
  },

  // Get Bid Details
  getBidDetails: async (bid_id: string) => {
    const response = await apiClient.get(`/admin/bids/${bid_id}`);
    return response.data;
  },

  // Update Bid
  updateBid: async (bid_id: string, data: any) => {
    const response = await apiClient.put(`/admin/bids/${bid_id}`, data);
    return response.data;
  },

  // Close Bid
  closeBid: async (bid_id: string) => {
    const response = await apiClient.put(`/admin/bids/${bid_id}/close`);
    return response.data;
  },

  // Cancel Bid
  cancelBid: async (bid_id: string, reason: string) => {
    const response = await apiClient.post(`/admin/bids/${bid_id}/cancel`, { reason });
    return response.data;
  },

  getBidSubmissions: async (bid_id: string) => {
    return { success: true, data: [] };
  },

  getBidTimeline: async (bid_id: string) => {
    return { success: true, data: [] };
  },

  // ========== FINANCIAL MANAGEMENT (CORE) ==========

  // Get Financial Stats
  getFinancialStats: async () => {
    const response = await apiClient.get('/admin/financial/stats');
    return response.data;
  },

  // Get Financial Metrics for Dashboard
  getFinancialMetrics: async (params?: { period: string }) => {
    const response = await apiClient.get('/admin/financial/stats', { params });
    return response.data;
  },

  // Get All Escrow Accounts
  getAllEscrowAccounts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/financial/escrow', { params });
    return response.data;
  },

  // Get Escrow Details
  getEscrowDetails: async (escrowId: string) => {
    const response = await apiClient.get(`/admin/financial/escrow/${escrowId}`);
    return response.data;
  },

  // Release Escrow Payment
  releaseEscrowPayment: async (accountId: string, data: {
    amount: number;
    reason: string;
    emergency?: boolean;
  }) => {
    const response = await apiClient.post(`/admin/financial/escrow/${accountId}/release`, data);
    return response.data;
  },

  // Freeze Escrow Account
  freezeEscrowAccount: async (accountId: string, reason: string) => {
    const response = await apiClient.post(`/admin/financial/escrow/${accountId}/freeze`, { reason });
    return response.data;
  },

  // Unfreeze Escrow Account
  unfreezeEscrowAccount: async (accountId: string, reason: string) => {
    const response = await apiClient.post(`/admin/financial/escrow/${accountId}/unfreeze`, { reason });
    return response.data;
  },

  // Refund Escrow to Owner
  refundEscrowToOwner: async (accountId: string, data: {
    amount?: number;
    reason: string;
  }) => {
    const response = await apiClient.post(`/admin/financial/escrow/${accountId}/refund`, data);
    return response.data;
  },

  // Adjust Escrow Amount
  adjustEscrowAmount: async (accountId: string, data: {
    new_amount: number;
    reason: string;
  }) => {
    const response = await apiClient.post(`/admin/financial/escrow/${accountId}/adjust`, data);
    return response.data;
  },

  // Generate Escrow Report
  generateEscrowReport: async (accountId: string, format: string) => {
    const response = await apiClient.get(`/admin/financial/escrow/${accountId}/report`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // ========== PAYOUT MANAGEMENT ==========

  // Get All Payouts
  getAllPayouts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get('/admin/payouts', { params });
    return response.data;
  },

  // Process Payout (Generic Status Update)
  processPayout: async (payoutId: string, status?: string) => {
    const response = await apiClient.post(`/admin/payouts/${payoutId}/process`, { status });
    return response.data;
  },

  // Approve Payout
  approvePayout: async (payoutId: string) => {
    const response = await apiClient.post(`/admin/payouts/${payoutId}/approve`);
    return response.data;
  },

  // Hold Payout
  holdPayout: async (payoutId: string, reason: string) => {
    const response = await apiClient.post(`/admin/payouts/${payoutId}/hold`, { reason });
    return response.data;
  },

  // Update Payout Bank Details
  updatePayoutBankDetails: async (payoutId: string, bankDetails: {
    account_number: string;
    routing_number: string;
    bank_name: string;
    account_type: string;
  }) => {
    const response = await apiClient.put(`/admin/payouts/${payoutId}/bank`, bankDetails);
    return response.data;
  },

  // Resend Failed Payout
  resendFailedPayout: async (payoutId: string) => {
    const response = await apiClient.post(`/admin/payouts/${payoutId}/resend`);
    return response.data;
  },

  // Generate 1099 Form
  generate1099Form: async (contractorId: string, year: number) => {
    const response = await apiClient.get(`/admin/payouts/1099/${contractorId}`, {
      params: { year },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get All Transactions
  getAllTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) => {
    const response = await apiClient.get('/admin/transactions', { params });
    return response.data;
  },

  // Get Transaction Details
  getTransactionDetails: async (transactionId: string) => {
    const response = await apiClient.get(`/admin/transactions/${transactionId}`);
    return response.data;
  },

  // Issue Refund
  issueRefund: async (transactionId: string, data: {
    amount?: number;
    reason: string;
    notify_user?: boolean;
  }) => {
    const response = await apiClient.post(`/admin/transactions/${transactionId}/refund`, data);
    return response.data;
  },

  // Cancel Transaction
  cancelTransaction: async (transactionId: string, reason: string) => {
    const response = await apiClient.post(`/admin/transactions/${transactionId}/cancel`, { reason });
    return response.data;
  },

  // ========== DISPUTES MANAGEMENT (CORE) ==========

  // Get All Support Tickets
  getAllSupportTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/support/tickets', { params });
    return response.data;
  },

  // Get All Disputes

  // Get Support Ticket Details
  getSupportTicketDetails: async (ticketId: string) => {
    const response = await apiClient.get(`/admin/support/tickets/${ticketId}`);
    return response.data;
  },

  // Get Canned Responses (Stub)
  getCannedResponses: async () => {
    return { success: true, data: { responses: [] } };
  },

  // Reply to Ticket
  replyToTicket: async (ticketId: string, data: any) => {
    const response = await apiClient.post(`/admin/support/tickets/${ticketId}/reply`, data);
    return response.data;
  },

  // Update Ticket
  updateSupportTicket: async (ticketId: string, data: any) => {
    const response = await apiClient.put(`/admin/support/tickets/${ticketId}/update`, data);
    return response.data;
  },

  // Close Ticket
  closeTicket: async (ticketId: string, resolution?: string) => {
    const response = await apiClient.post(`/admin/support/tickets/${ticketId}/close`, { resolution });
    return response.data;
  },

  // Reopen Ticket
  reopenTicket: async (ticketId: string, reason: string) => {
    const response = await apiClient.post(`/admin/support/tickets/${ticketId}/reopen`, { reason });
    return response.data;
  },

  // Add Note
  addTicketNote: async (ticketId: string, note: string) => {
    const response = await apiClient.post(`/admin/support/tickets/${ticketId}/notes`, { note });
    return response.data;
  },

  // Get All Disputes
  getAllDisputes: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get('/admin/disputes', { params });
    return response.data;
  },

  // ========== VERIFICATION MANAGEMENT (CORE) ==========

  // Get Verification Queue
  getVerificationQueue: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
  }) => {
    const response = await apiClient.get('/admin/verifications', { params });
    return response.data;
  },

  // Get Verification Stats
  getVerificationStats: async () => {
    const response = await apiClient.get('/admin/verifications/stats');
    return response.data;
  },

  // Get Verification Details
  getVerificationDetails: async (id: string) => {
    const response = await apiClient.get(`/admin/verifications/${id}`);
    return response.data;
  },

  // Alias for Identity Component (Reuse generic backend)
  getIdentityVerificationDetails: async (id: string) => {
    const response = await apiClient.get(`/admin/verifications/${id}`);
    return response.data;
  },

  approveIdentityVerification: async (id: string, notes: string) => {
    const response = await apiClient.post(`/admin/verifications/${id}/approve`, { notes });
    return response.data;
  },

  rejectIdentityVerification: async (id: string, reason: string) => {
    const response = await apiClient.post(`/admin/verifications/${id}/reject`, { reason });
    return response.data;
  },

  requestAdditionalDocuments: async (id: string, types: string[], message: string) => {
    // Stub
    return { success: true };
  },

  flagForManualReview: async (id: string, reason: string) => {
    // Stub
    return { success: true };
  },

  validateDocument: async (verificationId: string, documentId: string) => {
    // Stub
    return { success: true };
  },

  // ========== MODERATION (CORE) ==========

  // Get Moderation Queue
  getModerationQueue: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    content_type?: string;
    priority?: string;
  }) => {
    const response = await apiClient.get('/admin/moderation/reports', { params });
    return response.data;
  },

  // Resolve Moderation Item
  resolveModerationItem: async (reportId: string, action: string, notes?: string) => {
    const response = await apiClient.post(`/admin/moderation/reports/${reportId}/resolve`, { action, notes });
    return response.data;
  },

  // ========== AUDIT LOGS (CORE) ==========

  // Get Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data;
  },
  // ========== SYSTEM SETTINGS (CORE) ==========

  getSystemSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    // Transform array to object
    // response.data is the body { success: true, data: [] }
    // We check response.data.data for the array
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      const settingsObj = response.data.data.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      return { ...response.data, data: settingsObj }; // Return transformed data body
    }
    return response.data;
  },

  updateSystemSettings: async (settings: any) => {
    const response = await apiClient.post('/admin/settings', settings);
    return response.data;
  },

  getAuthenticationSettings: async () => {
    // Reuse system settings endpoint
    const response = await apiClient.get('/admin/settings');
    // Transform array to object
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      const settingsObj = response.data.data.reduce((acc: any, curr: any) => {
        // Convert 'true'/'false' strings to booleans and numbers to numbers if needed
        let val: any = curr.value;
        if (val === 'true') val = true;
        if (val === 'false') val = false;
        if (!isNaN(Number(val)) && val !== '') val = Number(val);

        acc[curr.key] = val;
        return acc;
      }, {});
      return { ...response.data, data: settingsObj };
    }
    return response.data;
  },

  getComplianceReports: async (type: string, params?: any) => {
    const response = await apiClient.get('/admin/audit-logs/compliance', { params: { ...params, type } });
    return response.data;
  },

  updateAuthenticationSettings: async (settings: any) => {
    const response = await apiClient.post('/admin/settings', settings);
    return response.data;
  },
};

export default adminService;
