import apiClient from './axios';

// Types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const messagesService = {
  // Get conversation messages
  getConversationMessages: async (conversationId: string): Promise<{ success: boolean; data: Message[] }> => {
    const response = await apiClient.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  // Send message
  sendMessage: async (conversationId: string, content: string): Promise<{ success: boolean; data: Message }> => {
    const response = await apiClient.post('/messages', {
      conversation_id: conversationId,
      content,
    });
    return response.data;
  },

  // Mark message as read
  markMessageAsRead: async (messageId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  // Mark all messages in conversation as read
  markConversationAsRead: async (conversationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },
};

