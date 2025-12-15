import apiClient from './axios';

// Types - matches actual backend response
export interface Dispute {
  id: string;
  project_id: string;
  raised_by: string;
  reason: string;
  description?: string;
  status: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
    owner_id: string;
    contractor_id: string;
    conversations?: {
      id: string;
      messages?: {
        id: string;
        content: string;
        created_at: string;
        sender?: {
          first_name: string;
          last_name: string;
        };
      }[];
    }[];
  };
  raised_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  responses?: {
    id: string;
    message: string;
    created_at: string;
    user_id: string;
    evidence?: any[];
  }[];
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
    const response = await apiClient.get('/admin/disputes', { params });
    return response.data;
  },

  // Get dispute by ID
  getDisputeById: async (id: string): Promise<{ success: boolean; data: Dispute }> => {
    const response = await apiClient.get(`/disputes/${id}`);
    return response.data;
  },

  // Resolve dispute
  resolveDispute: async (id: string, data: { resolution: string; resolution_notes: string }): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.put(`/disputes/${id}/resolve`, data);
    return response.data;
  },

  // Close dispute
  closeDispute: async (id: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.put(`/disputes/${id}/close`);
    return response.data;
  },

  // Add response to dispute
  addDisputeResponse: async (id: string, message: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post(`/disputes/${id}/responses`, { message });
    return response.data;
  },
};

