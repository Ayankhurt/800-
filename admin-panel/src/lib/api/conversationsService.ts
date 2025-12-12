import apiClient from './axios';

// Types
export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at?: string;
  created_at: string;
  participant1?: {
    id: string;
    full_name: string;
    email: string;
  };
  participant2?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const conversationsService = {
  // Get all conversations (for support tickets)
  getAllConversations: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Conversation[]; total?: number }> => {
    const response = await apiClient.get('/conversations', { params });
    return response.data;
  },

  // Get conversation by ID
  getConversationById: async (id: string): Promise<{ success: boolean; data: Conversation }> => {
    const response = await apiClient.get(`/conversations/${id}`);
    return response.data;
  },
};

