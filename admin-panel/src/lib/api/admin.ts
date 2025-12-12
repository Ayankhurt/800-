import apiClient from './client';

export const adminAPI = {
    // Dashboard
    getDashboardStats: async () => {
        return await apiClient.get('/admin/dashboard/stats');
    },

    // Users
    getUsers: async (params?: any) => {
        return await apiClient.get('/admin/users', { params });
    },

    getUserById: async (id: string) => {
        return await apiClient.get(`/admin/users/${id}`);
    },

    updateUser: async (id: string, data: any) => {
        return await apiClient.patch(`/admin/users/${id}`, data);
    },

    deleteUser: async (id: string) => {
        return await apiClient.delete(`/admin/users/${id}`);
    },

    changeUserRole: async (user_id: string, role: string) => {
        return await apiClient.post('/admin/users/change-role', { user_id, role });
    },

    suspendUser: async (id: string, reason: string, duration?: number) => {
        return await apiClient.post(`/admin/users/${id}/suspend`, { reason, duration });
    },

    unsuspendUser: async (id: string) => {
        return await apiClient.post(`/admin/users/${id}/unsuspend`);
    },

    verifyUser: async (user_id: string) => {
        return await apiClient.post('/admin/users/verify', { user_id });
    },

    // Projects
    getProjects: async (params?: any) => {
        return await apiClient.get('/admin/projects', { params });
    },

    getProjectById: async (id: string) => {
        return await apiClient.get(`/admin/projects/${id}`);
    },

    // Jobs
    getJobs: async (params?: any) => {
        return await apiClient.get('/admin/jobs', { params });
    },

    // Bids
    getBids: async (params?: any) => {
        return await apiClient.get('/admin/bids', { params });
    },

    // Financial
    getFinancialStats: async () => {
        return await apiClient.get('/admin/financial/stats');
    },

    getTransactions: async (params?: any) => {
        return await apiClient.get('/admin/transactions', { params });
    },

    // Disputes
    getDisputes: async (params?: any) => {
        return await apiClient.get('/admin/disputes', { params });
    },

    // Support
    getSupportTickets: async (params?: any) => {
        return await apiClient.get('/admin/support/tickets', { params });
    },

    // Verification
    getVerifications: async (params?: any) => {
        return await apiClient.get('/admin/verifications', { params });
    },

    // Moderation
    getReports: async (params?: any) => {
        return await apiClient.get('/admin/moderation/reports', { params });
    },

    // Analytics
    getAnalytics: async (period: number = 30) => {
        return await apiClient.get('/admin/analytics', { params: { period } });
    },

    // Settings
    getSettings: async () => {
        return await apiClient.get('/admin/settings');
    },

    updateSetting: async (key: string, value: any, description?: string) => {
        return await apiClient.post('/admin/settings', { key, value, description });
    },

    // Audit Logs
    getAuditLogs: async (params?: any) => {
        return await apiClient.get('/admin/audit-logs', { params });
    },

    // Referrals
    getReferralStats: async () => {
        return await apiClient.get('/admin/referrals/stats');
    },
};
