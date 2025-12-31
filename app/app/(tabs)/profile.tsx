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
import { Image } from 'expo-image';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  colors: any;
  styles: any;
}

function MenuItem({ icon, label, value, onPress, destructive, colors, styles }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <Text
          style={[styles.menuLabel, { color: colors.text }, destructive && { color: colors.error }]}
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
  styles: any;
}

function MenuSection({ title, children, colors, styles }: MenuSectionProps) {
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

  const styles = createStyles(colors);

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
    avatar: profileData.avatar_url || profileData.avatar || contextUser?.avatar,
    two_factor_enabled: profileData.two_factor_enabled ?? profileData.twoFactorEnabled ?? contextUser?.two_factor_enabled,
  } : contextUser;

  // Visible for Admin only
  const isAdmin = (user?.role as any) === "ADMIN" || (user?.role as any) === "super_admin" || (user?.role as any) === "admin";

  const handleUserManagement = () => {
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
    const isWeb = typeof window !== 'undefined' && window.confirm;

    if (isWeb) {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        try {
          await logout();
        } catch (error: any) {
          console.error("Logout error:", error);
        }
      }
    } else {
      Alert.alert(
        "Log Out",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel" },
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
        ]
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Profile",
          headerLargeTitle: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {isLoading && !profileData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>
                      {user?.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "?"}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.profileName}>{user?.fullName || "User"}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role}</Text>
              </View>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
              <Text style={styles.companyName}>{user?.company}</Text>
            </View>

            <MenuSection title="Account Information" colors={colors} styles={styles}>
              <MenuItem
                icon={<Mail size={20} color={colors.primary} />}
                label="Email"
                value={user?.email}
                onPress={handleEditProfile}
                colors={colors}
                styles={styles}
              />
              <MenuItem
                icon={<Phone size={20} color={colors.primary} />}
                label="Phone"
                value={user?.phone}
                onPress={handleEditProfile}
                colors={colors}
                styles={styles}
              />
              <MenuItem
                icon={<Building2 size={20} color={colors.primary} />}
                label="Company"
                value={user?.company}
                onPress={handleEditProfile}
                colors={colors}
                styles={styles}
              />
              <MenuItem
                icon={<User size={20} color={colors.primary} />}
                label="Edit Profile"
                onPress={handleEditProfile}
                colors={colors}
                styles={styles}
              />
              {(user?.role === "SUB" || user?.role === "TS" || user?.role === "GC") && (
                <MenuItem
                  icon={<Eye size={20} color={colors.info} />}
                  label="View My Public Profile"
                  onPress={handleViewPublicProfile}
                  colors={colors}
                  styles={styles}
                />
              )}
            </MenuSection>

            <MenuSection title="Communication" colors={colors} styles={styles}>
              <MenuItem
                icon={<Bell size={20} color={colors.textSecondary} />}
                label="Notifications"
                value={contextUnreadCount > 0 ? `${contextUnreadCount} new` : undefined}
                onPress={handleNotifications}
                colors={colors}
                styles={styles}
              />
              <MenuItem
                icon={<MessageCircle size={20} color={colors.textSecondary} />}
                label="Messages"
                onPress={handleMessages}
                colors={colors}
                styles={styles}
              />
            </MenuSection>

            <MenuSection title="Security & Privacy" colors={colors} styles={styles}>
              <MenuItem
                icon={<Settings size={20} color={colors.textSecondary} />}
                label="Account Settings"
                onPress={handleSettings}
                colors={colors}
                styles={styles}
              />
              <MenuItem
                icon={<Shield size={20} color={colors.textSecondary} />}
                label="Privacy Policy"
                onPress={handlePrivacy}
                colors={colors}
                styles={styles}
              />
            </MenuSection>

            <MenuSection title="Support" colors={colors} styles={styles}>
              <MenuItem
                icon={<HelpCircle size={20} color={colors.textSecondary} />}
                label="Help & Support"
                onPress={handleHelp}
                colors={colors}
                styles={styles}
              />
              <MenuItem
                icon={<FileText size={20} color={colors.textSecondary} />}
                label="Terms of Service"
                onPress={handleTerms}
                colors={colors}
                styles={styles}
              />
            </MenuSection>

            {isAdmin && (
              <MenuSection title="Admin Tools" colors={colors} styles={styles}>
                <MenuItem
                  icon={<Shield size={20} color={colors.primary} />}
                  label="User Management"
                  onPress={handleUserManagement}
                  colors={colors}
                  styles={styles}
                />
                <MenuItem
                  icon={<FolderKanban size={20} color={colors.primary} />}
                  label="Project Approvals"
                  onPress={handleProjectApprovals}
                  colors={colors}
                  styles={styles}
                />
                <MenuItem
                  icon={<AlertTriangle size={20} color={colors.primary} />}
                  label="Disputes Panel"
                  onPress={handleDisputesPanel}
                  colors={colors}
                  styles={styles}
                />
                <MenuItem
                  icon={<DollarSign size={20} color={colors.primary} />}
                  label="Finance"
                  onPress={handleFinance}
                  colors={colors}
                  styles={styles}
                />
                <MenuItem
                  icon={<Bell size={20} color={colors.primary} />}
                  label="Notifications Center"
                  onPress={handleNotificationsCenter}
                  colors={colors}
                  styles={styles}
                />
              </MenuSection>
            )}

            <MenuSection title="Account" colors={colors} styles={styles}>
              <MenuItem
                icon={<LogOut size={20} color={colors.error} />}
                label="Log Out"
                onPress={handleLogout}
                destructive
                colors={colors}
                styles={styles}
              />
            </MenuSection>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>Bidroom v1.0.0</Text>
              <Text style={[styles.footerText, { color: colors.textTertiary }]}>© 2025 Bidroom. All rights reserved.</Text>
            </View>
          </>
        )}
      </ScrollView>

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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  adminBadge: {
    backgroundColor: colors.error + "15",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.error,
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    maxWidth: 150,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
});
