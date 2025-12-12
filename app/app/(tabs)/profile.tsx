import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/contexts/JobsContext";
import { Stack, useRouter } from "expo-router";
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
} from "lucide-react-native";
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
import { userAPI } from "@/services/api";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, value, onPress, destructive }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <Text
          style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        <ChevronRight
          size={20}
          color={destructive ? Colors.error : Colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: contextUser, logout } = useAuth();
  const { getUnreadNotificationsCount } = useJobs();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      console.log("[API] GET /users/me");
      const response = await userAPI.getProfile();
      
      if (response.success && response.data) {
        setProfileData(response.data);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch profile:", error);
      // Use context user as fallback
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
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



  const handleLogout = () => {
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
          onPress: logout,
        },
      ],
      { cancelable: true }
    );
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
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTitleStyle: {
            color: Colors.text,
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
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {user?.fullName
                ?.split(" ")
                .map((n: string) => n[0])
                .join("") || "?"}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.fullName || "User"}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
          {/* Admin badge - only visible for ADMIN role */}
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
          <Text style={styles.companyName}>{user?.company}</Text>
        </View>

        <MenuSection title="Account Information">
          <MenuItem
            icon={<Mail size={20} color={Colors.primary} />}
            label="Email"
            value={user?.email}
            onPress={handleEditProfile}
          />
          <MenuItem
            icon={<Phone size={20} color={Colors.primary} />}
            label="Phone"
            value={user?.phone}
            onPress={handleEditProfile}
          />
          <MenuItem
            icon={<Building2 size={20} color={Colors.primary} />}
            label="Company"
            value={user?.company}
            onPress={handleEditProfile}
          />
          <MenuItem
            icon={<User size={20} color={Colors.primary} />}
            label="Edit Profile"
            onPress={handleEditProfile}
          />
        </MenuSection>

        <MenuSection title="Communication">
          <MenuItem
            icon={<Bell size={20} color={Colors.textSecondary} />}
            label="Notifications"
            value={getUnreadNotificationsCount() > 0 ? `${getUnreadNotificationsCount()} new` : undefined}
            onPress={handleNotifications}
          />
          <MenuItem
            icon={<MessageCircle size={20} color={Colors.textSecondary} />}
            label="Messages"
            onPress={handleMessages}
          />
        </MenuSection>

        <MenuSection title="Preferences">
          <MenuItem
            icon={<Settings size={20} color={Colors.textSecondary} />}
            label="Settings"
            onPress={handleSettings}
          />
          <MenuItem
            icon={<Shield size={20} color={Colors.textSecondary} />}
            label="Privacy & Security"
            onPress={handlePrivacy}
          />
        </MenuSection>

        <MenuSection title="Support">
          <MenuItem
            icon={<HelpCircle size={20} color={Colors.textSecondary} />}
            label="Help & Support"
            onPress={handleHelp}
          />
          <MenuItem
            icon={<FileText size={20} color={Colors.textSecondary} />}
            label="Terms of Service"
            onPress={handleTerms}
          />
        </MenuSection>

        {/* Admin-only section */}
        {isAdmin && (
          <MenuSection title="Admin">
            <MenuItem
              icon={<Shield size={20} color={Colors.primary} />}
              label="User Management"
              onPress={handleUserManagement}
            />
            <MenuItem
              icon={<FolderKanban size={20} color={Colors.primary} />}
              label="Project Approvals"
              onPress={handleProjectApprovals}
            />
            <MenuItem
              icon={<AlertTriangle size={20} color={Colors.primary} />}
              label="Disputes Panel"
              onPress={handleDisputesPanel}
            />
            <MenuItem
              icon={<DollarSign size={20} color={Colors.primary} />}
              label="Finance"
              onPress={handleFinance}
            />
            <MenuItem
              icon={<Bell size={20} color={Colors.primary} />}
              label="Notifications Center"
              onPress={handleNotificationsCenter}
            />
          </MenuSection>
        )}

        <MenuSection title="Account">
          <MenuItem
            icon={<LogOut size={20} color={Colors.error} />}
            label="Log Out"
            onPress={handleLogout}
            destructive
          />
        </MenuSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Bidroom v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Bidroom. All rights reserved.</Text>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + "20",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  adminBadge: {
    backgroundColor: Colors.error + "15",
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.error,
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.text,
    fontWeight: "500" as const,
  },
  menuLabelDestructive: {
    color: Colors.error,
  },
  menuItemRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    maxWidth: 150,
  },
  footer: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: 64,
  },
});
