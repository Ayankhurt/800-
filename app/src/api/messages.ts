import apiClient from "./client";
import { ApiResponse, Message, Conversation, PaginatedResponse } from "./types";

/**
 * Messages & Conversations API
 * 
 * Endpoints:
 * - GET    /conversations → get conversations list
 * - POST   /conversations → create conversation
 * - GET    /messages/:conversation_id → get messages
 * - POST   /messages → send message
 */

export interface CreateConversationData {
  participant_id: string;
  initial_message?: string;
}

export interface SendMessageData {
  conversation_id: string;
  content: string;
  attachments?: string[];
  images?: string[];
  documents?: string[];
}

const messagesAPI = {
  /**
   * Get all conversations
   * GET /conversations
   */
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    try {
      const response = await apiClient.get("/conversations");
      return response.data;
    } catch (error: any) {
      console.error("Get conversations API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Get conversation by ID
   * GET /conversations/:id
   */
  getConversationById: async (id: string): Promise<ApiResponse<Conversation>> => {
    try {
      const response = await apiClient.get(`/conversations/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get conversation by ID API error:", error);
      throw error;
    }
  },

  /**
   * Create or get conversation
   * POST /conversations
   */
  createConversation: async (data: CreateConversationData): Promise<ApiResponse<Conversation>> => {
    try {
      const response = await apiClient.post("/conversations", data);
      return response.data;
    } catch (error: any) {
      console.error("Create conversation API error:", error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation
   * GET /messages/conversations/:conversationId
   */
  getMessages: async (conversationId: string, filters?: { limit?: number; offset?: number }): Promise<ApiResponse<PaginatedResponse<Message>>> => {
    try {
      const params: any = {};
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await apiClient.get(`/messages/conversations/${conversationId}`, { params });
      return response.data;
    } catch (error: any) {
      console.error("Get messages API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { data: [], total: 0 } };
      }
      throw error;
    }
  },

  /**
   * Send a message
   * POST /messages
   */
  send: async (data: SendMessageData): Promise<ApiResponse<Message>> => {
    try {
      const response = await apiClient.post("/messages", data);
      return response.data;
    } catch (error: any) {
      console.error("Send message API error:", error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   * PUT /messages/conversations/:conversationId/read
   */
  markAsRead: async (conversationId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.put(`/messages/conversations/${conversationId}/read`);
      return response.data;
    } catch (error: any) {
      console.error("Mark messages as read API error:", error);
      throw error;
    }
  },

  /**
   * Mark single message as read
   * PATCH /messages/:id/read
   */
  markMessageAsRead: async (messageId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.patch(`/messages/${messageId}/read`);
      return response.data;
    } catch (error: any) {
      console.error("Mark message as read API error:", error);
      throw error;
    }
  },

  /**
   * Get unread message count
   * GET /messages/unread/count
   */
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    try {
      const response = await apiClient.get("/messages/unread/count");
      return response.data;
    } catch (error: any) {
      console.error("Get unread count API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { count: 0 } };
      }
      throw error;
    }
  },
};

export default messagesAPI;




