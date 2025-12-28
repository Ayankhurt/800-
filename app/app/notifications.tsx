import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  Bell,
  BellOff,
  FileText,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  AlertCircle,
  Briefcase,
  DollarSign,
  AlertTriangle,
  FileCheck,
  Users,
  Clock,
  Trash2,
  TrendingUp,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, Notification, NotificationType } from "@/contexts/NotificationsContext";

const staticColors = {
  primary: "#2563EB",
  secondary: "#F97316",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
  info: "#3B82F6",
  primaryLight: "#EFF6FF",
};
import { notificationsAPI } from "@/services/api";

const getNotificationIcon = (type: NotificationType, colors: any) => {
  switch (type) {
    case "new_job":
    case "job_updated":
    case "job_cancelled":
      return <Briefcase size={20} color={colors.info} />;
    case "new_application":
    case "application_withdrawn":
      return <FileText size={20} color={colors.primary} />;
    case "application_accepted":
      return <CheckCircle size={20} color={colors.success} />;
    case "application_rejected":
      return <XCircle size={20} color={colors.error} />;
    case "new_message":
      return <MessageCircle size={20} color={colors.secondary} />;
    case "estimate_requested":
    case "estimate_confirmed":
    case "estimate_reminder":
    case "estimate_completed":
    case "estimate_cancelled":
    case "appointment_scheduled":
    case "appointment_confirmed":
    case "appointment_reminder":
    case "appointment_cancelled":
    case "appointment_rescheduled":
      return <Calendar size={20} color={colors.warning} />;
    case "bid_invitation":
    case "bid_submitted":
    case "bid_accepted":
    case "bid_rejected":
    case "bid_updated":
      return <FileCheck size={20} color={colors.info} />;
    case "project_created":
    case "project_started":
    case "project_completed":
      return <Briefcase size={20} color={colors.success} />;
    case "milestone_created":
    case "milestone_submitted":
    case "milestone_approved":
    case "milestone_rejected":
    case "milestone_payment_released":
      return <CheckCircle size={20} color={colors.primary} />;
    case "payment_received":
    case "payment_sent":
    case "payment_failed":
    case "escrow_deposited":
    case "escrow_released":
      return <DollarSign size={20} color={colors.success} />;
    case "change_order_requested":
    case "change_order_approved":
    case "change_order_rejected":
      return <FileText size={20} color={colors.warning} />;
    case "dispute_filed":
    case "dispute_resolved":
    case "dispute_escalated":
      return <AlertTriangle size={20} color={colors.error} />;
    case "progress_update_posted":
    case "progress_update_late":
      return <TrendingUp size={20} color={colors.info} />;
    case "contract_ready":
    case "contract_signed":
    case "document_uploaded":
    case "document_approval_needed":
      return <FileCheck size={20} color={colors.primary} />;
    case "inspection_scheduled":
    case "inspection_completed":
      return <CheckCircle size={20} color={colors.info} />;
    case "team_member_added":
    case "team_member_removed":
      return <Users size={20} color={colors.secondary} />;
    case "deadline_approaching":
    case "deadline_missed":
      return <Clock size={20} color={colors.error} />;
    case "system_alert":
      return <AlertCircle size={20} color={colors.warning} />;
    case "info":
      return <AlertCircle size={20} color={colors.info} />;
    case "success":
      return <CheckCircle size={20} color={colors.success} />;
    case "warning":
      return <AlertTriangle size={20} color={colors.warning} />;
    case "error":
      return <XCircle size={20} color={colors.error} />;
    default:
      return <Bell size={20} color={colors.textSecondary} />;
  }
};

const getNotificationColor = (type: NotificationType, colors: any) => {
  if (type.includes("accepted") || type.includes("approved") || type.includes("completed") || type.includes("resolved")) {
    return colors.success;
  }
  if (type.includes("rejected") || type.includes("cancelled") || type.includes("dispute") || type.includes("missed")) {
    return colors.error;
  }
  if (type.includes("payment") || type.includes("escrow")) {
    return colors.success;
  }
  if (type.includes("reminder") || type.includes("approaching") || type.includes("late")) {
    return colors.warning;
  }
  if (type.includes("message")) {
    return colors.secondary;
  }
  return colors.primary;
};


export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useAuth();
  const {
    notifications: contextNotifications,
    unreadCount: contextUnreadCount,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
    deleteNotification: contextDeleteNotification,
  } = useNotifications();
  const [apiNotifications, setApiNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      console.log("[API] GET /notifications");
      const response = await notificationsAPI.getAll();
      console.log("[DEBUG] Notifications Response:", JSON.stringify(response));

      if (response.success && response.data) {
        // Handle response.data being { notifications: [] } or just []
        const rawNotifications = Array.isArray(response.data)
          ? response.data
          : (response.data.notifications || response.data.data || []);

        console.log(`[DEBUG] Raw Notifications found: ${rawNotifications.length}`);

        const mappedNotifications = Array.isArray(rawNotifications) ? rawNotifications.map((notif: any) => ({
          id: notif.id || notif.notification_id,
          userId: notif.user_id || notif.userId,
          type: (notif.type || notif.notification_type || "system_alert") as NotificationType,
          title: notif.title || notif.subject,
          message: notif.message || notif.body || notif.content,
          read: notif.is_read || notif.read || false,
          createdAt: notif.created_at || notif.createdAt || new Date().toISOString(),
          priority: notif.priority || "normal",
          actionUrl: notif.action_url || notif.actionUrl,
          jobId: notif.job_id || notif.jobId,
          appointmentId: notif.appointment_id || notif.appointmentId,
          bidId: notif.bid_id || notif.bidId,
          projectId: notif.project_id || notif.projectId,
        })) : [];
        console.log(`[DEBUG] Mapped Notifications: ${mappedNotifications.length}`);
        setApiNotifications(mappedNotifications);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch notifications:", error);
      // Fallback to context notifications
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      console.log("[API] GET /notifications/unread/count");
      const response = await notificationsAPI.getUnreadCount();

      if (response.success && response.data) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch unread count:", error);
      setUnreadCount(contextUnreadCount);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    setRefreshing(false);
  };

  // Use API notifications if available, otherwise fallback to context
  const notifications = apiNotifications.length > 0 ? apiNotifications : contextNotifications;

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read via API
    try {
      console.log("[API] PUT /notifications/:id/read", notification.id);
      await notificationsAPI.markAsRead(notification.id);
      // Update local state
      setApiNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("[API] Failed to mark notification as read:", error);
      // Fallback to context
      contextMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    } else if (notification.jobId) {
      router.push(`/job-details?id=${notification.jobId}`);
    } else if (notification.appointmentId) {
      router.push(`/appointment-details?id=${notification.appointmentId}`);
    } else if (notification.bidId) {
      router.push(`/bid-details?id=${notification.bidId}`);
    } else if (notification.projectId) {
      router.push(`/project-dashboard?id=${notification.projectId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      console.log("[API] PUT /notifications/read/all");
      const response = await notificationsAPI.markAllAsRead();

      if (response.success) {
        Alert.alert("Success", "All notifications marked as read");
        // Update local state
        setApiNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error: any) {
      console.error("[API] Failed to mark all as read:", error);
      Alert.alert("Error", "Failed to mark all notifications as read");
      // Fallback to context
      contextMarkAllAsRead();
    }
  };

  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: {
      title: string;
      data: Notification[];
    }[] = [];

    const todayNotifs = notifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date >= today;
    });

    const yesterdayNotifs = notifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date >= yesterday && date < today;
    });

    const thisWeekNotifs = notifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date >= weekAgo && date < yesterday;
    });

    const olderNotifs = notifications.filter((n) => {
      const date = new Date(n.createdAt);
      return date < weekAgo;
    });

    if (todayNotifs.length > 0) {
      groups.push({ title: "Today", data: todayNotifs });
    }
    if (yesterdayNotifs.length > 0) {
      groups.push({ title: "Yesterday", data: yesterdayNotifs });
    }
    if (thisWeekNotifs.length > 0) {
      groups.push({ title: "This Week", data: thisWeekNotifs });
    }
    if (olderNotifs.length > 0) {
      groups.push({ title: "Older", data: olderNotifs });
    }

    return groups;
  }, [notifications]);

  const handleDelete = async (id: string) => {
    try {
      Alert.alert(
        "Delete Notification",
        "Are you sure you want to delete this notification?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                // Delete via API and Context
                await contextDeleteNotification(id);

                // Update local screen state
                const notif = apiNotifications.find(n => n.id === id);
                if (notif && !notif.read) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setApiNotifications(prev => prev.filter(n => n.id !== id));
              } catch (error) {
                console.error("Failed to delete notification:", error);
                Alert.alert("Error", "Failed to delete notification");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Notifications",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={handleMarkAllRead}
              >
                <Text style={[styles.markAllText, { color: colors.primary }]}>Mark All Read</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      {isLoading && notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <BellOff size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Notifications</Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            You&apos;re all caught up! Notifications will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedNotifications}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{item.title}</Text>
              {item.data.map((notification) => (
                <View key={notification.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.notificationCard,
                      { backgroundColor: colors.surface, borderBottomColor: colors.border },
                      !notification.read && [styles.notificationCardUnread, { backgroundColor: colors.primary + "05" }],
                      notification.priority === "high" && [styles.notificationCardHigh, { borderLeftColor: colors.warning }],
                      notification.priority === "critical" && [styles.notificationCardCritical, { borderLeftColor: colors.error }],
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor:
                            getNotificationColor(notification.type, colors) + "15",
                        },
                      ]}
                    >
                      {getNotificationIcon(notification.type, colors)}
                    </View>

                    <View style={styles.notificationContent}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          { color: colors.text },
                          !notification.read && [styles.notificationTitleUnread, { fontWeight: "700" }],
                        ]}
                      >
                        {notification.title}
                      </Text>
                      <Text
                        style={[
                          styles.notificationMessage,
                          { color: colors.textSecondary },
                          !notification.read && [styles.notificationMessageUnread, { color: colors.text }],
                        ]}
                        numberOfLines={2}
                      >
                        {notification.message}
                      </Text>
                      <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
                        {formatNotificationTime(notification.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.rightActionContainer}>
                      {!notification.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                      >
                        <Trash2 size={18} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  listContent: {
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: staticColors.textSecondary,
    textTransform: "uppercase" as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  notificationCard: {
    flexDirection: "row" as const,
    backgroundColor: staticColors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  notificationCardUnread: {
    backgroundColor: staticColors.primary + "08",
  },
  notificationCardHigh: {
    borderLeftWidth: 3,
    borderLeftColor: staticColors.warning,
  },
  notificationCardCritical: {
    borderLeftWidth: 3,
    borderLeftColor: staticColors.error,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: "700" as const,
  },
  notificationMessage: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationMessageUnread: {
    color: staticColors.text,
  },
  notificationTime: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: staticColors.primary,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 22,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  rightActionContainer: {
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingLeft: 8,
    minHeight: 60,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
});
