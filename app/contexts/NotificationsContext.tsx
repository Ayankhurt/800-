// NotificationsContext.tsx
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { notificationsAPI } from "@/services/api";

export type NotificationType =
  | "new_job"
  | "new_application"
  | "application_accepted"
  | "application_rejected"
  | "application_withdrawn"
  | "new_message"
  | "job_updated"
  | "job_cancelled"
  | "estimate_requested"
  | "estimate_confirmed"
  | "estimate_reminder"
  | "estimate_completed"
  | "estimate_cancelled"
  | "appointment_scheduled"
  | "appointment_confirmed"
  | "appointment_reminder"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "bid_invitation"
  | "bid_submitted"
  | "bid_accepted"
  | "bid_rejected"
  | "bid_updated"
  | "project_created"
  | "project_started"
  | "project_completed"
  | "milestone_created"
  | "milestone_submitted"
  | "milestone_approved"
  | "milestone_rejected"
  | "milestone_payment_released"
  | "payment_received"
  | "payment_sent"
  | "payment_failed"
  | "escrow_deposited"
  | "escrow_released"
  | "change_order_requested"
  | "change_order_approved"
  | "change_order_rejected"
  | "dispute_filed"
  | "dispute_resolved"
  | "dispute_escalated"
  | "progress_update_posted"
  | "progress_update_late"
  | "contract_ready"
  | "contract_signed"
  | "document_uploaded"
  | "document_approval_needed"
  | "inspection_scheduled"
  | "inspection_completed"
  | "team_member_added"
  | "team_member_removed"
  | "system_alert"
  | "deadline_approaching"
  | "deadline_missed"
  | "info"
  | "success"
  | "warning"
  | "error";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  actionUrl?: string;
  jobId?: string;
  applicationId?: string;
  appointmentId?: string;
  bidId?: string;
  projectId?: string;
  milestoneId?: string;
  disputeId?: string;
  data?: any;
  createdAt: string;
}

export const [NotificationsProvider, useNotifications] = createContextHook(() => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      // Don't set loading true on refresh if we already have data (silent update)
      const response = await notificationsAPI.getAll();
      if (response && response.data && Array.isArray(response.data.notifications)) {
        const mapped: Notification[] = response.data.notifications.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type || "info",
          title: n.title,
          message: n.content || n.message || "",
          priority: n.priority || "normal",
          read: n.is_reads || n.is_read || false,
          createdAt: n.created_at,
          data: n.metadata,
        }));
        setNotifications(mapped);
      }
    } catch (error) {
      console.error("Failed to load notifications in context:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load and Polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, fetchNotifications]);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "userId" | "createdAt" | "read">) => {
    // Client-side simulation only suitable for immediate feedback, 
    // real notifications normally come from backend.
    // We'll trust polling for now, or you can implement optimistic UI if needed.
    console.warn("addNotification is deprecated in favor of backend polling");
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      await notificationsAPI.markAsRead(notificationId);
    } catch (error) {
      console.error("Failed to mark as read:", error);
      fetchNotifications(); // Revert on error
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await notificationsAPI.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      await notificationsAPI.delete(notificationId);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteAllNotifications = useCallback(() => {
    // Implement if backend supports delete all
    console.warn("deleteAllNotifications not implemented in backend");
  }, []);

  const getUnreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getUnreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getNotificationsByPriority = useCallback((priority: NotificationPriority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  return useMemo(() => ({
    notifications,
    isLoading,
    unreadCount: getUnreadCount,
    unreadNotifications: getUnreadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    refreshNotifications: fetchNotifications, // Expose refresh
  }), [notifications, isLoading, getUnreadCount, getUnreadNotifications, addNotification, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, getNotificationsByType, getNotificationsByPriority, fetchNotifications]);
});
