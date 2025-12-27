import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Bell,
  Building2,
  ChevronRight,
  DollarSign,
  FileText,
  FolderKanban,
  HelpCircle,
  History,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Settings,
  Shield,
  User,
  AlertTriangle,
  Users,
  Eye,
  Smartphone,
} from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useJobs } from "@/contexts/JobsContext";
import { userAPI } from "@/services/api";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

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


interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  colors: any;
}

function MenuItem({ icon, label, value, onPress, destructive, colors }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <Text
          style={[styles.menuLabel, { color: colors.text }, destructive && [styles.menuLabelDestructive, { color: colors.error }]]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={[styles.menuValue, { color: colors.textSecondary }]}>{value}</Text>}
        <ChevronRight
          size={20}
          color={destructive ? colors.error : colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
  colors: any;
}

function MenuSection({ title, children, colors }: MenuSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: contextUser, logout, colors } = useAuth();
  const { unreadCount: contextUnreadCount } = useNotifications();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      console.log("[API] GET /users/me");
      const response = await userAPI.getProfile();

      if (response.success && response.data) {
        setProfileData(response.data);
        console.log("[Profile] Data loaded successfully");
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch profile:", error);

      // Show appropriate error message
      if (error.message?.includes("Network Error") || error.message?.includes("connect")) {
        toast.error("No internet connection. Using cached data.");
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load profile. Pull to retry.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile(true);
    setRefreshing(false);
  };

  // Use API profile data if available, otherwise fallback to context user
  const user = profileData ? {
    ...contextUser,
    fullName: profileData.fullName || profileData.full_name || contextUser?.fullName,
    email: profileData.email || contextUser?.email,
    phone: profileData.phone || profileData.phone_number || contextUser?.phone,
    company: profileData.company || profileData.company_name || profileData.companyName || contextUser?.company,
    avatar: profileData.avatar || profileData.avatar_url || contextUser?.avatar,
    two_factor_enabled: profileData.two_factor_enabled ?? profileData.twoFactorEnabled ?? contextUser?.two_factor_enabled,
  } : contextUser;

  // Visible for Admin only
  const isAdmin = user?.role === "ADMIN";

  const handleUserManagement = () => {
    // Navigate to user management screen (admin only)
    router.push("/admin/user-management" as any);
  };

  const handleProjectApprovals = () => {
    router.push("/admin/projects" as any);
  };

  const handleDisputesPanel = () => {
    router.push("/admin/disputes" as any);
  };

  const handleFinance = () => {
    router.push("/admin/finance" as any);
  };

  const handleNotificationsCenter = () => {
    router.push("/admin/notifications" as any);
  };



  const handleLogout = async () => {
    // Check if running on web
    const isWeb = typeof window !== 'undefined' && window.confirm;

    if (isWeb) {
      // Web: use confirm dialog
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        try {
          console.log("[Logout] Starting logout...");
          await logout();
          console.log("[Logout] Logout successful");
        } catch (error: any) {
          console.error("Logout error:", error);
        }
      }
    } else {
      // Native: use Alert
      Alert.alert(
        "Log Out",
        "Are you sure you want to log out?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Log Out",
            style: "destructive",
            onPress: async () => {
              try {
                toast.info("Logging out...");
                await logout();
                toast.success("Logged out successfully");
              } catch (error: any) {
                console.error("Logout error:", error);
                toast.warning("Logged out (offline mode)");
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleViewPublicProfile = () => {
    router.push(`/contractor-profile?id=${user?.id}`);
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleMessages = () => {
    router.push("/messages");
  };

  const handlePrivacy = () => {
    router.push("/privacy");
  };

  const handleHelp = () => {
    router.push("/help");
  };

  const handleTerms = () => {
    router.push("/terms");
  };

  const handleMFASetup = () => {
    router.push("/mfa-setup");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Profile",
          headerLargeTitle: true,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && !profileData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={[styles.avatarLarge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.avatarLargeText, { color: colors.primary }]}>
                  {user?.fullName
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "?"}
                </Text>
              </View>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName || "User"}</Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role}</Text>
              </View>
              {/* Admin badge - only visible for ADMIN role */}
              {isAdmin && (
                <View style={[styles.adminBadge, { backgroundColor: colors.error + "15", borderColor: colors.error }]}>
                  <Text style={[styles.adminBadgeText, { color: colors.error }]}>ADMIN</Text>
                </View>
              )}
              <Text style={[styles.companyName, { color: colors.textSecondary }]}>{user?.company}</Text>
            </View>

            <MenuSection title="Account Information" colors={colors}>
              <MenuItem
                icon={<Mail size={20} color={colors.primary} />}
                label="Email"
                value={user?.email}
                onPress={handleEditProfile}
                colors={colors}
              />
              <MenuItem
                icon={<Phone size={20} color={colors.primary} />}
                label="Phone"
                value={user?.phone}
                onPress={handleEditProfile}
                colors={colors}
              />
              <MenuItem
                icon={<Building2 size={20} color={colors.primary} />}
                label="Company"
                value={user?.company}
                onPress={handleEditProfile}
                colors={colors}
              />
              <MenuItem
                icon={<User size={20} color={colors.primary} />}
                label="Edit Profile"
                onPress={handleEditProfile}
                colors={colors}
              />
              {(user?.role === "SUB" || user?.role === "TS") && (
                <MenuItem
                  icon={<Eye size={20} color={colors.info} />}
                  label="View My Public Profile"
                  onPress={handleViewPublicProfile}
                  colors={colors}
                />
              )}
            </MenuSection>

            <MenuSection title="Communication" colors={colors}>
              <MenuItem
                icon={<Bell size={20} color={colors.textSecondary} />}
                label="Notifications"
                value={contextUnreadCount > 0 ? `${contextUnreadCount} new` : undefined}
                onPress={handleNotifications}
                colors={colors}
              />
              <MenuItem
                icon={<MessageCircle size={20} color={colors.textSecondary} />}
                label="Messages"
                onPress={handleMessages}
                colors={colors}
              />
            </MenuSection>

            <MenuSection title="Security & Privacy" colors={colors}>
              <MenuItem
                icon={<Settings size={20} color={colors.textSecondary} />}
                label="Account Settings"
                onPress={handleSettings}
                colors={colors}
              />
              <MenuItem
                icon={<Shield size={20} color={colors.textSecondary} />}
                label="Privacy Policy"
                onPress={handlePrivacy}
                colors={colors}
              />
            </MenuSection>

            <MenuSection title="Support" colors={colors}>
              <MenuItem
                icon={<HelpCircle size={20} color={colors.textSecondary} />}
                label="Help & Support"
                onPress={handleHelp}
                colors={colors}
              />
              <MenuItem
                icon={<FileText size={20} color={colors.textSecondary} />}
                label="Terms of Service"
                onPress={handleTerms}
                colors={colors}
              />
            </MenuSection>

            {/* Admin-only section */}
            {isAdmin && (
              <MenuSection title="Admin" colors={colors}>
                <MenuItem
                  icon={<Shield size={20} color={colors.primary} />}
                  label="User Management"
                  onPress={handleUserManagement}
                  colors={colors}
                />
                <MenuItem
                  icon={<FolderKanban size={20} color={colors.primary} />}
                  label="Project Approvals"
                  onPress={handleProjectApprovals}
                  colors={colors}
                />
                <MenuItem
                  icon={<AlertTriangle size={20} color={colors.primary} />}
                  label="Disputes Panel"
                  onPress={handleDisputesPanel}
                  colors={colors}
                />
                <MenuItem
                  icon={<DollarSign size={20} color={colors.primary} />}
                  label="Finance"
                  onPress={handleFinance}
                  colors={colors}
                />
                <MenuItem
                  icon={<Bell size={20} color={colors.primary} />}
                  label="Notifications Center"
                  onPress={handleNotificationsCenter}
                  colors={colors}
                />
              </MenuSection>
            )}

            <MenuSection title="Account" colors={colors}>
              <MenuItem
                icon={<LogOut size={20} color={colors.error} />}
                label="Log Out"
                onPress={handleLogout}
                destructive
                colors={colors}
              />
            </MenuSection>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>Bidroom v1.0.0</Text>
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>© 2025 Bidroom. All rights reserved.</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Toast notifications */}
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          type={t.type}
          message={t.message}
          visible={t.visible}
          onDismiss={() => toast.dismissToast(t.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: staticColors.primary + "20",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: staticColors.primary + "15",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  adminBadge: {
    backgroundColor: staticColors.error + "15",
    borderWidth: 1,
    borderColor: staticColors.error,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: staticColors.error,
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: staticColors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: staticColors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: staticColors.border,
  },
  menuItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  menuItemLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  menuLabel: {
    fontSize: 16,
    color: staticColors.text,
    fontWeight: "500" as const,
  },
  menuLabelDestructive: {
    color: staticColors.error,
  },
  menuItemRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: staticColors.textSecondary,
    maxWidth: 150,
  },
  footer: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: 64,
  },
});
