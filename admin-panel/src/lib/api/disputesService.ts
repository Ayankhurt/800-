import apiClient from './axios';

// Types
export interface Dispute {
  id: string;
  project_id: string;
  complainant_id: string;
  respondent_id: string;
  status: string;
  priority?: string;
  category?: string;
  amount?: number;
  description?: string;
  assigned_admin_id?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  complainant?: {
    id: string;
    full_name: string;
    email: string;
  };
  respondent?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const disputesService = {
  // Get all disputes (for admins, this returns all disputes)
  getAllDisputes: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: { disputes: Dispute[]; total: number } }> => {
    const response = await apiClient.get('/disputes', { params });
    return response.data;
  },

  // Get dispute by ID
  getDisputeById: async (id: string): Promise<{ success: boolean; data: Dispute }> => {
    const response = await apiClient.get(`/disputes/${id}`);
    return response.data;
  },

  // Update dispute status
  updateDisputeStatus: async (id: string, status: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/disputes/${id}/status`, { status });
    return response.data;
  },

  // Assign dispute to admin
  assignDispute: async (id: string, admin_id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/disputes/${id}/assign`, { admin_id });
    return response.data;
  },

  // Get dispute messages
  getDisputeMessages: async (id: string): Promise<{ success: boolean; data: DisputeMessage[] }> => {
    const response = await apiClient.get(`/disputes/${id}/messages`);
    return response.data;
  },

  // Add message to dispute
  addDisputeMessage: async (id: string, message: string): Promise<{ success: boolean; data: DisputeMessage }> => {
    const response = await apiClient.post(`/disputes/${id}/messages`, { message });
    return response.data;
  },
};

