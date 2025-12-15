import apiClient from './axios';

// Types
export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method?: string;
  bank_account?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const payoutsService = {
  // Get all payouts
  getAllPayouts: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: { payouts: Payout[]; total: number } }> => {
    const response = await apiClient.get('/admin/payouts', { params });
    return response.data;
  },

  // Get payout by ID
  getPayoutById: async (id: string): Promise<{ success: boolean; data: Payout }> => {
    const response = await apiClient.get(`/admin/payouts/${id}`);
    return response.data;
  },

  // Approve payout (Admin)
  approvePayout: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/admin/payouts/${id}/approve`);
    return response.data;
  },

  // Reject payout (Admin)
  rejectPayout: async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/admin/payouts/${id}/reject`, { reason });
    return response.data;
  },
};

