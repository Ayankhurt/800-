import apiClient from './axios';

// ========== USER MANAGEMENT (CORE) ==========

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

  // ========== PROJECTS MANAGEMENT (CORE) ==========

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

  // ========== FINANCIAL MANAGEMENT (CORE) ==========

  // Get Financial Stats
  getFinancialStats: async () => {
    const response = await apiClient.get('/admin/financial/stats');
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

  // ========== DISPUTES MANAGEMENT (CORE) ==========

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

  // Get All Verification Requests
  getAllVerificationRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await apiClient.get('/admin/verifications', { params });
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
};

export default adminService;
