import apiClient from './axios';

// Types
export interface AdminDashboardStats {
  total_users?: number;
  active_projects?: number;
  total_revenue?: number;
  open_disputes?: number;
  weekly_activity?: Array<{
    date: string;
    users: number;
    projects: number;
  }>;
  user_distribution?: Array<{
    role: string;
    count: number;
  }>;
  recent_activity?: Array<{
    id: string;
    user: string;
    action: string;
    project?: string;
    time: string;
    status: string;
  }>;
}

export const statsService = {
  // Get admin dashboard stats
  getAdminDashboardStats: async (): Promise<{ success: boolean; data: AdminDashboardStats }> => {
    const response = await apiClient.get('/stats/admin-dashboard');
    return response.data;
  },
};

