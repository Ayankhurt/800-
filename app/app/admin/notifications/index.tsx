import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { Stack } from "expo-router";
import {
  Bell,
  Search,
  Trash2,
  Send,
  AlertCircle,
  Filter,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  created_at?: string;
  read?: boolean;
}

type FilterType = "all" | "system" | "dispute" | "payment" | "project";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [showSendModal, setShowSendModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("system");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.");
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllNotifications();
      const notificationsData = response?.data || response || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchNotifications();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (selectedFilter !== "all") {
      filtered = filtered.filter((notif) => {
        const type = notif.type?.toLowerCase() || "";
        return type === selectedFilter;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notif) =>
          notif.title?.toLowerCase().includes(query) ||
          notif.message?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, selectedFilter, searchQuery]);

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("[API] DELETE /notifications/:id", id);
            const response = await adminAPI.deleteNotification(id);
            if (response.success) {
              Alert.alert("Success", "Notification deleted successfully");
              await fetchNotifications();
            } else {
              Alert.alert("Error", response.message || "Failed to delete notification");
            }
          } catch (error: any) {
            console.log("[API ERROR]", error);
            Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
          }
        },
      },
    ]);
  };

  const handleSend = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setSending(true);
      await adminAPI.sendNotification({
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        type: notificationType,
        broadcast: true,
      });
      Alert.alert("Success", "Notification sent successfully", [
        {
          text: "OK",
          onPress: () => {
            setShowSendModal(false);
            setNotificationTitle("");
            setNotificationMessage("");
            setNotificationType("system");
            fetchNotifications();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <Bell size={20} color={Colors.primary} />
        <Text style={styles.notificationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      {item.created_at && (
        <Text style={styles.notificationDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "system", label: "System" },
    { key: "dispute", label: "Dispute" },
    { key: "payment", label: "Payment" },
    { key: "project", label: "Project" },
  ];

  if (user && user.role !== "ADMIN") {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Unauthorized" }} />
        <View style={styles.unauthorizedContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.unauthorizedText}>Access Denied</Text>
        </View>
      </View>
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: "Notifications Center" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "Notifications Center",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowSendModal(true)}
              style={styles.sendButton}
            >
              <Send size={20} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No notifications found</Text>
          </View>
        }
      />

      {/* Send Notification Modal */}
      <Modal
        visible={showSendModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Notification</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              placeholderTextColor={Colors.textSecondary}
              value={notificationTitle}
              onChangeText={setNotificationTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Message"
              placeholderTextColor={Colors.textSecondary}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowSendModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSend}
                disabled={sending}
              >
                <Text style={styles.modalButtonTextConfirm}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  unauthorizedText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.error,
    marginTop: 16,
  },
  sendButton: {
    marginRight: 16,
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  modalTextArea: {
    minHeight: 100,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});

