import apiClient from './axios';

// Types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string; // Changed from message to content
  is_read: boolean; // Changed from read to is_read
  read_at?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    total: number;
    unread?: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    unread: number;
  };
}

export const notificationsService = {
  // Get user notifications
  getUserNotifications: async (params?: {
    limit?: number;
    offset?: number;
    is_read?: boolean;
  }): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  // Get all notifications (admin)
  getAllNotifications: async (params?: {
    limit?: number;
    offset?: number;
    user_id?: string;
    is_read?: boolean;
    type?: string;
  }): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/notifications/all', { params });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<{ success: boolean; message: string; data: Notification }> => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean; message: string; data: { updated: number } }> => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get('/notifications/unread/count');
    return response.data;
  },

  // Send bulk notifications (admin)
  sendBulkNotifications: async (data: {
    user_ids: string[];
    message: string;
    type?: string;
    title?: string;
  }): Promise<{ success: boolean; message: string; data: { sent: number; notifications: Notification[] } }> => {
    const response = await apiClient.post('/admin/notifications/bulk', data);
    return response.data;
  },
};
