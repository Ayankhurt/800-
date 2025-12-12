import apiClient from './axios';

// Types
export interface Payment {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const paymentsService = {
  // Get all payments
  getAllPayments: async (params?: {
    userId?: string;
    status?: string;
    project_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Payment[]; total?: number }> => {
    const response = await apiClient.get('/payments', { params });
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (id: string): Promise<{ success: boolean; data: Payment }> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  // Get project payments
  getProjectPayments: async (projectId: string): Promise<{ success: boolean; data: Payment[] }> => {
    const response = await apiClient.get(`/payments/projects/${projectId}`);
    return response.data;
  },
};

