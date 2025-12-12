import apiClient from "./client";
import { ApiResponse, Notification, PaginatedResponse } from "./types";

/**
 * Notifications API
 * 
 * Endpoints:
 * - GET /notifications → get notifications
 * - PATCH /notifications/:id/mark-read → mark as read
 * - POST /notifications/register-device → register FCM/APNs token
 */

export interface RegisterDeviceData {
  device_token: string;
  platform: 'ios' | 'android' | 'web';
  device_id?: string;
}

const notificationsAPI = {
  /**
   * Get all notifications
   * GET /notifications
   */
  getAll: async (filters?: { read?: boolean; limit?: number; offset?: number }): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
    try {
      const params: any = {};
      if (filters?.read !== undefined) params.read = filters.read;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await apiClient.get("/notifications", { params });
      return response.data;
    } catch (error: any) {
      console.error("Get notifications API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { data: [], total: 0 } };
      }
      throw error;
    }
  },

  /**
   * Mark notification as read
   * PATCH /notifications/:id/mark-read or PUT /notifications/:id/read or PUT /notifications/:id
   */
  markAsRead: async (notificationId: string): Promise<ApiResponse> => {
    try {
      let response;
      try {
        response = await apiClient.patch(`/notifications/${notificationId}/mark-read`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          try {
            response = await apiClient.put(`/notifications/${notificationId}/read`);
          } catch (error2: any) {
            if (error2.response?.status === 404) {
              response = await apiClient.put(`/notifications/${notificationId}`, { read: true });
            } else {
              throw error2;
            }
          }
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Mark notification as read API error:", error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * PUT /notifications/read/all
   */
  markAllAsRead: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.put("/notifications/read/all");
      return response.data;
    } catch (error: any) {
      console.error("Mark all notifications as read API error:", error);
      throw error;
    }
  },

  /**
   * Register device for push notifications
   * POST /notifications/register-device
   */
  registerDevice: async (data: RegisterDeviceData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post("/notifications/register-device", data);
      return response.data;
    } catch (error: any) {
      console.error("Register device API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: null };
      }
      throw error;
    }
  },

  /**
   * Get unread notification count
   * GET /notifications/unread/count
   */
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    try {
      const response = await apiClient.get("/notifications/unread/count");
      return response.data;
    } catch (error: any) {
      console.error("Get unread count API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { count: 0 } };
      }
      throw error;
    }
  },

  /**
   * Delete notification
   * DELETE /notifications/:id
   */
  delete: async (notificationId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error: any) {
      console.error("Delete notification API error:", error);
      throw error;
    }
  },
};

export default notificationsAPI;




