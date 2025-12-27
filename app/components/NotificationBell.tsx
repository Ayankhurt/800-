import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";

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
};

export default function NotificationBell() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { colors } = useAuth();

  const handlePress = () => {
    router.push("/notifications");
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      testID="notification-bell"
    >
      <Bell size={24} color={colors.text} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.surface }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    position: "relative" as const,
    width: 40,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  badge: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    backgroundColor: staticColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: staticColors.surface,
  },
  badgeText: {
    color: staticColors.white,
    fontSize: 11,
    fontWeight: "700" as const,
  },
});
