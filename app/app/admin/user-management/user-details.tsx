import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Trash2,
  Ban,
  CheckSquare,
  Lock,
  Unlock,
  History,
  UserCheck,
  RefreshCw,
  UserCog,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

// Available roles for admin to assign (excluding EDITOR)
const ALL_ROLES = [
  { code: "admin", label: "Admin" },
  { code: "super_admin", label: "Super Admin" },
  { code: "finance_manager", label: "Finance" },
  { code: "moderator", label: "Moderator" },
  { code: "support_agent", label: "Support" },
  { code: "project_manager", label: "Project Manager" },
  { code: "general_contractor", label: "General Contractor" },
  { code: "subcontractor", label: "Subcontractor" },
  { code: "trade_specialist", label: "Trade Specialist" },
  { code: "viewer", label: "Viewer" },
];

// Get available roles based on current user's role
const getAvailableRoles = (currentUserRole: string | undefined) => {
  const role = (currentUserRole || "").toUpperCase();

  // SUPER admin can change ADMIN roles but not SUPER admin roles
  if (role === "SUPER") {
    return ALL_ROLES.filter((r) => r.code !== "SUPER");
  }

  // Regular ADMIN cannot assign ADMIN or SUPER roles
  if (role === "ADMIN") {
    return ALL_ROLES.filter((r) => r.code !== "ADMIN" && r.code !== "SUPER");
  }

  // Default: return all roles
  return ALL_ROLES;
};

// Check if current user can change target user's role
const canChangeRole = (currentUserRole: string | undefined, targetUserRole: string | undefined) => {
  const currentRole = (currentUserRole || "").toUpperCase();
  const targetRole = (targetUserRole || "").toUpperCase();

  // SUPER admin can change ADMIN roles and all other roles except SUPER admin roles
  if (currentRole === "SUPER") {
    return targetRole !== "SUPER";
  }

  // ADMIN cannot change ADMIN or SUPER admin roles
  if (currentRole === "ADMIN") {
    return targetRole !== "ADMIN" && targetRole !== "SUPER";
  }

  return false;
};

interface UserDetails {
  id: string;
  fullName?: string;
  full_name?: string;
  email: string;
  phone?: string;
  role?: string;
  role_code?: string;
  status?: string;
  email_verified?: boolean;
  created_at?: string;
  createdAt?: string;
  last_login?: string;
  lastLogin?: string;
  is_active?: boolean;
  verification_status?: string;
  company?: string;
  companyName?: string;
  company_name?: string;
}

interface ActivityLog {
  id: string;
  type: "login" | "verify" | "suspend" | "unsuspend" | "role_change" | "profile_update" | "job_action" | "bid_action";
  description: string;
  timestamp: string;
  metadata?: any;
}

type TabType = "info" | "logs";


export default function UserDetailsScreen() {
  const router = useRouter();
  const { id, userData } = useLocalSearchParams();
  const { user, login } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionHistory, setActionHistory] = useState<string[]>([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const userId = Array.isArray(id) ? id[0] : id;
  const userDataParam = Array.isArray(userData) ? userData[0] : userData;

  // Role security - only ADMIN can access
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  // Initialize user details from passed data or fetch
  useEffect(() => {
    if (user?.role === "ADMIN" && userId) {
      if (userDataParam) {
        try {
          const parsedUserData = JSON.parse(decodeURIComponent(userDataParam));
          if (parsedUserData && parsedUserData.id === userId) {
            setUserDetails(parsedUserData);
            setLoading(false);
            loadActionHistory(parsedUserData);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse user data from params:", e);
        }
      }
      fetchUserDetails();
    }
  }, [userId, user, userDataParam]);

  // Load activity logs when tab is switched
  useEffect(() => {
    if (activeTab === "logs" && userId && !logsLoading && activityLogs.length === 0) {
      fetchActivityLogs();
    }
  }, [activeTab, userId]);

  // Fetch user details
  const fetchUserDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await adminAPI.getUserById(userId);
      const userData = response?.data || response;
      if (userData && userData.id) {
        setUserDetails(userData);
        loadActionHistory(userData);
      } else if (userDataParam) {
        try {
          const parsedUserData = JSON.parse(decodeURIComponent(userDataParam));
          if (parsedUserData && parsedUserData.id === userId) {
            setUserDetails(parsedUserData);
            loadActionHistory(parsedUserData);
          }
        } catch (e) {
          // Ignore
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404 && userDataParam) {
        try {
          const parsedUserData = JSON.parse(decodeURIComponent(userDataParam));
          if (parsedUserData && parsedUserData.id === userId) {
            setUserDetails(parsedUserData);
            loadActionHistory(parsedUserData);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Ignore
        }
      }
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load action history from user data
  const loadActionHistory = (userData: UserDetails) => {
    const history: string[] = [];
    if (userData.email_verified) {
      history.push(`Verified on ${new Date(userData.created_at || userData.createdAt || Date.now()).toLocaleDateString()}`);
    }
    if (userData.status === "suspended") {
      history.push(`Suspended on ${new Date().toLocaleDateString()}`);
    }
    if (userData.last_login || userData.lastLogin) {
      history.push(`Last login: ${new Date(userData.last_login || userData.lastLogin || "").toLocaleDateString()}`);
    }
    setActionHistory(history);
  };

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    if (!userId) return;

    try {
      setLogsLoading(true);
      // Try to fetch from login logs API filtered by user_id
      const response = await adminAPI.getUserActivityLogs(userId);
      const logs = response?.data || response || [];
      setActivityLogs(Array.isArray(logs) ? logs : []);
    } catch (error: any) {
      console.warn("Failed to fetch activity logs:", error);
      // Generate dummy logs if API not available
      generateDummyLogs();
    } finally {
      setLogsLoading(false);
    }
  };

  // Generate dummy logs for demonstration
  const generateDummyLogs = () => {
    const dummyLogs: ActivityLog[] = [
      {
        id: "1",
        type: "login",
        description: "Logged in from iPhone 12",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        type: "verify",
        description: "Email verified by admin",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        type: "profile_update",
        description: "Profile updated",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    setActivityLogs(dummyLogs);
  };

  const handleAction = async (
    action: "verify" | "suspend" | "unsuspend" | "delete" | "lock" | "unlock",
    actionName: string
  ) => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }

    const userName = userDetails?.fullName || userDetails?.full_name || userDetails?.email || "this user";

    // Special handling for lock action (needs reason prompt)
    if (action === "lock") {
      setLockReason("");
      setShowLockModal(true);
      return;
    }

    // For all other actions, show confirmation alert
    Alert.alert(
      `Confirm ${actionName}`,
      `Are you sure you want to ${actionName.toLowerCase()} ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionName,
          style: action === "delete" ? "destructive" : "default",
          onPress: async () => {
            try {
              setActionLoading(true);
              let response;

              console.log(`[UserDetails] Starting ${action} action for user:`, userId);

              switch (action) {
                case "verify":
                  console.log("[UserDetails] Calling verifyUser API...");
                  response = await adminAPI.verifyUser(userId);
                  console.log("[UserDetails] verifyUser response:", response);
                  break;
                case "suspend":
                  console.log("[UserDetails] Calling suspendUser API...");
                  response = await adminAPI.suspendUser(userId);
                  console.log("[UserDetails] suspendUser response:", response);
                  break;
                case "unsuspend":
                  console.log("[UserDetails] Calling unsuspendUser API...");
                  response = await adminAPI.unsuspendUser(userId);
                  console.log("[UserDetails] unsuspendUser response:", response);
                  break;
                case "unlock":
                  console.log("[UserDetails] Calling unlockUser API...");
                  response = await adminAPI.unlockUser(userId);
                  console.log("[UserDetails] unlockUser response:", response);
                  break;
                case "delete":
                  console.log("[UserDetails] Calling deleteUser API...");
                  response = await adminAPI.deleteUser(userId);
                  console.log("[UserDetails] deleteUser response:", response);
                  break;
              }

              console.log(`[UserDetails] ${action} action completed successfully`);

              // Show success message and refresh UI
              Alert.alert("Success", `${actionName} completed successfully`, [
                {
                  text: "OK",
                  onPress: async () => {
                    if (action === "delete") {
                      // Navigate back to user management list
                      router.back();
                    } else {
                      // Refresh user details to sync with backend
                      try {
                        await fetchUserDetails();
                      } catch (refreshError) {
                        console.error("Failed to refresh user details:", refreshError);
                      }
                    }
                  },
                },
              ]);
            } catch (error: any) {
              console.error(`[UserDetails] Failed to ${action}:`, error);
              let errorMessage = `Failed to ${actionName.toLowerCase()} user`;

              if (error.response) {
                const status = error.response.status;
                const data = error.response.data;

                if (data?.message) {
                  errorMessage = data.message;
                  // Special handling for unsuspend when user is not suspended
                  if (action === "unsuspend" && data.message.includes("not suspended")) {
                    errorMessage = "This user is not currently suspended. Refreshing user data...";
                    // Refresh user data to sync state
                    setTimeout(() => {
                      fetchUserDetails().catch(() => { });
                    }, 1000);
                  }
                } else if (status === 400) {
                  // Handle 400 Bad Request specifically
                  if (action === "unsuspend") {
                    errorMessage = "User is not suspended. Refreshing user data...";
                    setTimeout(() => {
                      fetchUserDetails().catch(() => { });
                    }, 1000);
                  } else {
                    errorMessage = `Invalid request: ${data?.error || "Bad request"}`;
                  }
                } else if (status === 404) {
                  errorMessage = `Endpoint not found. The ${actionName.toLowerCase()} feature may not be available on the backend.`;
                } else if (status === 403) {
                  errorMessage = "You don't have permission to perform this action.";
                } else if (status === 401) {
                  errorMessage = "Authentication failed. Please login again.";
                } else if (status >= 500) {
                  errorMessage = "Server error. Please try again later.";
                } else {
                  errorMessage = `Error ${status}: ${data?.error || error.message || "Unknown error"}`;
                }
              } else if (error.message) {
                errorMessage = error.message;
              }

              Alert.alert("Error", errorMessage, [
                {
                  text: "OK",
                  onPress: () => {
                    // Refresh user data to sync state after error (especially for unsuspend)
                    if (action === "unsuspend") {
                      fetchUserDetails().catch(() => { });
                    }
                  },
                },
              ]);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle role change
  const handleRoleChange = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }

    if (!selectedRole || selectedRole.trim() === "") {
      Alert.alert("Error", "Please select a role");
      return;
    }

    // Check permissions
    const currentUserRole = (user?.role || "").toString().toUpperCase();
    const targetUserRole = ((userDetails?.role || userDetails?.role_code) || "").toString().toUpperCase();

    if (!canChangeRole(currentUserRole, targetUserRole)) {
      Alert.alert("Permission Denied", "You don't have permission to change this user's role.");
      setShowRoleModal(false);
      return;
    }

    // Prevent ADMIN from changing ADMIN or SUPER admin roles
    if (currentUserRole === "ADMIN" && (targetUserRole === "SUPER" || targetUserRole === "ADMIN")) {
      Alert.alert("Permission Denied", "You cannot change Admin or Super Admin roles.");
      setShowRoleModal(false);
      return;
    }

    // Prevent SUPER admin from assigning SUPER admin role to anyone
    if (currentUserRole === "SUPER" && selectedRole === "SUPER") {
      Alert.alert("Permission Denied", "You cannot assign Super Admin role to anyone.");
      setShowRoleModal(false);
      return;
    }

    // Prevent SUPER admin from changing SUPER admin roles
    if (currentUserRole === "SUPER" && targetUserRole === "SUPER") {
      Alert.alert("Permission Denied", "You cannot change Super Admin roles.");
      setShowRoleModal(false);
      return;
    }

    // Prevent ADMIN from assigning ADMIN or SUPER admin roles
    if (currentUserRole === "ADMIN" && (selectedRole === "ADMIN" || selectedRole === "SUPER")) {
      Alert.alert("Permission Denied", "You cannot assign Admin or Super Admin roles.");
      setShowRoleModal(false);
      return;
    }

    const currentRole = userDetails?.role || userDetails?.role_code || "USER";
    if (selectedRole === currentRole) {
      Alert.alert("Info", "User already has this role");
      setShowRoleModal(false);
      return;
    }

    Alert.alert(
      "Confirm Role Change",
      `Are you sure you want to change ${userDetails?.fullName || userDetails?.full_name || userDetails?.email || "this user"}'s role from ${currentRole} to ${selectedRole}?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setShowRoleModal(false) },
        {
          text: "Change Role",
          style: "default",
          onPress: async () => {
            try {
              setActionLoading(true);
              setShowRoleModal(false);
              console.log(`[UserDetails] Calling changeUserRole API for userId: ${userId}, roleCode: ${selectedRole}`);
              const response = await adminAPI.changeUserRole(userId, selectedRole);
              console.log(`[UserDetails] changeUserRole response:`, response);

              Alert.alert("Success", "User role changed successfully", [
                {
                  text: "OK",
                  onPress: async () => {
                    try {
                      await fetchUserDetails();
                    } catch (refreshError) {
                      console.error("Failed to refresh user details:", refreshError);
                    }
                  },
                },
              ]);
            } catch (roleError: any) {
              console.error(`[UserDetails] Failed to change role:`, roleError);
              let errorMessage = "Failed to change user role";
              if (roleError.response) {
                const status = roleError.response.status;
                const data = roleError.response.data;
                if (data?.message) {
                  errorMessage = data.message;
                } else if (status === 404) {
                  errorMessage = "Role change endpoint not found. This feature may not be available on the backend.";
                } else if (status === 403) {
                  errorMessage = "You don't have permission to perform this action.";
                } else if (status === 401) {
                  errorMessage = "Authentication failed. Please login again.";
                } else if (status >= 500) {
                  errorMessage = "Server error. Please try again later.";
                }
              } else if (roleError.message) {
                errorMessage = roleError.message;
              }
              Alert.alert("Error", errorMessage);
            } finally {
              setActionLoading(false);
              setSelectedRole("");
            }
          },
        },
      ]
    );
  };

  // Handle lock user with reason
  const handleLockUser = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID is missing");
      return;
    }

    if (!lockReason || lockReason.trim() === "") {
      Alert.alert("Error", "Please provide a reason for locking the user");
      return;
    }

    try {
      setActionLoading(true);
      setShowLockModal(false);
      console.log(`[UserDetails] Calling lockUser API for userId: ${userId}, reason: ${lockReason}`);
      const response = await adminAPI.lockUser(userId, lockReason.trim());
      console.log(`[UserDetails] lockUser response:`, response);

      // Refresh user details to get updated status from backend
      Alert.alert("Success", "User locked successfully", [
        {
          text: "OK",
          onPress: async () => {
            try {
              await fetchUserDetails();
            } catch (refreshError) {
              console.error("Failed to refresh user details:", refreshError);
            }
          },
        },
      ]);
    } catch (lockError: any) {
      console.error(`[UserDetails] Failed to lock user:`, lockError);
      let errorMessage = "Failed to lock user";
      if (lockError.response) {
        const status = lockError.response.status;
        const data = lockError.response.data;
        if (data?.message) {
          errorMessage = data.message;
        } else if (status === 404) {
          errorMessage = "Lock endpoint not found. This feature may not be available on the backend.";
        } else if (status === 403) {
          errorMessage = "You don't have permission to perform this action.";
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (lockError.message) {
        errorMessage = lockError.message;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setActionLoading(false);
      setLockReason("");
    }
  };

  const getStatusInfo = () => {
    const status = userDetails?.status?.toLowerCase();
    const isActive = userDetails?.is_active !== undefined ? userDetails.is_active : true;
    const isVerified = userDetails?.verification_status === "verified";

    if (status === "locked") {
      return {
        label: "Locked",
        color: "#8E8E93",
        icon: <Lock size={20} color="#8E8E93" />,
      };
    }

    if (isActive === false || status === "suspended" || status === "inactive") {
      return {
        label: "Suspended",
        color: "#8E8E93",
        icon: <Ban size={20} color="#8E8E93" />,
      };
    }

    if (isVerified) {
      return {
        label: "Verified",
        color: Colors.success,
        icon: <CheckCircle size={20} color={Colors.success} />,
      };
    }

    return {
      label: "Active",
      color: Colors.primary,
      icon: <User size={20} color={Colors.primary} />,
    };
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === "admin" || roleLower === "super_admin") {
      return { bg: Colors.error + "15", border: Colors.error, text: Colors.error };
    } else if (roleLower === "general_contractor") {
      return { bg: "#FF9500" + "15", border: "#FF9500", text: "#FF9500" };
    } else if (roleLower === "project_manager") {
      return { bg: "#007AFF" + "15", border: "#007AFF", text: "#007AFF" };
    } else if (roleLower === "subcontractor" || roleLower === "trade_specialist") {
      return { bg: "#AF52DE" + "15", border: "#AF52DE", text: "#AF52DE" };
    } else if (roleLower === "viewer") {
      return { bg: "#5AC8FA" + "15", border: "#5AC8FA", text: "#5AC8FA" };
    }
    return { bg: Colors.primaryLight, border: Colors.primary, text: Colors.primary };
  };

  // Block non-admin access
  if (user && user.role !== "ADMIN") {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Unauthorized" }} />
        <View style={styles.unauthorizedContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.unauthorizedText}>Access Denied</Text>
          <Text style={styles.unauthorizedSubtext}>Only Admin users can access this screen.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "User Details",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading user details...</Text>
        </View>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "User Details",
          }}
        />
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>User not found</Text>
        </View>
      </View>
    );
  }

  const fullName = userDetails.fullName || userDetails.full_name || "Unknown User";
  const role = userDetails.role || userDetails.role_code || "USER";
  const statusInfo = getStatusInfo();
  const isSuspended = userDetails.status?.toLowerCase() === "suspended" || userDetails.status?.toLowerCase() === "inactive";
  const isLocked = userDetails.status?.toLowerCase() === "locked";
  const isVerified = userDetails.email_verified;
  const roleColors = getRoleBadgeColor(role);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "User Details",
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTitleStyle: {
            color: Colors.text,
            fontWeight: "700" as const,
          },
        }}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "info" && styles.tabActive]}
          onPress={() => setActiveTab("info")}
        >
          <User size={18} color={activeTab === "info" ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>User Info</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "logs" && styles.tabActive]}
          onPress={() => setActiveTab("logs")}
        >
          <History size={18} color={activeTab === "logs" ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === "logs" && styles.tabTextActive]}>Activity Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === "info" ? (
          <>
            {/* User Header */}
            <View style={styles.headerSection}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarText}>
                  {fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <Text style={styles.userName}>{fullName}</Text>
              <View style={styles.roleContainer}>
                <View style={[styles.roleBadge, { backgroundColor: roleColors.bg, borderColor: roleColors.border }]}>
                  <Shield size={16} color={roleColors.text} />
                  <Text style={[styles.roleText, { color: roleColors.text }]}>{role}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "15", borderColor: statusInfo.color }]}>
                  {statusInfo.icon}
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>
              </View>
            </View>

            {/* Action History Panel */}
            {actionHistory.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Last Actions</Text>
                {actionHistory.map((action, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Clock size={16} color={Colors.textSecondary} />
                    <Text style={styles.historyText}>{action}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoRow}>
                <Mail size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userDetails.email}</Text>
                </View>
              </View>
              {userDetails.phone && (
                <View style={styles.infoRow}>
                  <Phone size={20} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{userDetails.phone}</Text>
                  </View>
                </View>
              )}
              {(userDetails.company || userDetails.companyName || userDetails.company_name) && (
                <View style={styles.infoRow}>
                  <Shield size={20} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Company</Text>
                    <Text style={styles.infoValue}>
                      {userDetails.company || userDetails.companyName || userDetails.company_name}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Account Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              {userDetails.created_at || userDetails.createdAt ? (
                <View style={styles.infoRow}>
                  <Calendar size={20} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Created</Text>
                    <Text style={styles.infoValue}>
                      {new Date(userDetails.created_at || userDetails.createdAt || "").toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ) : null}
              {(userDetails.last_login || userDetails.lastLogin) && (
                <View style={styles.infoRow}>
                  <Clock size={20} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Last Login</Text>
                    <Text style={styles.infoValue}>
                      {new Date(userDetails.last_login || userDetails.lastLogin || "").toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Admin Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admin Actions</Text>

              {/* Change Role Button - Only show if user can change role */}
              {canChangeRole(user?.role, userDetails?.role || userDetails?.role_code) && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.primaryLight, borderColor: Colors.primary }]}
                  onPress={() => {
                    setSelectedRole(userDetails?.role || userDetails?.role_code || "");
                    setShowRoleModal(true);
                  }}
                  disabled={actionLoading}
                >
                  <UserCog size={20} color={Colors.primary} />
                  <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Change Role</Text>
                </TouchableOpacity>
              )}

              {!isVerified && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.verifyButton]}
                  onPress={() => handleAction("verify", "Verify")}
                  disabled={actionLoading}
                >
                  <CheckSquare size={20} color={Colors.success} />
                  <Text style={styles.actionButtonText}>Verify User</Text>
                </TouchableOpacity>
              )}

              {!isSuspended ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.suspendButton]}
                  onPress={() => handleAction("suspend", "Suspend")}
                  disabled={actionLoading}
                >
                  <Ban size={20} color={Colors.warning} />
                  <Text style={styles.actionButtonText}>Suspend User</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.unsuspendButton]}
                  onPress={() => handleAction("unsuspend", "Unsuspend")}
                  disabled={actionLoading}
                >
                  <CheckCircle size={20} color={Colors.success} />
                  <Text style={styles.actionButtonText}>Unsuspend User</Text>
                </TouchableOpacity>
              )}

              {!isLocked ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#8E8E93" + "15", borderColor: "#8E8E93" }]}
                  onPress={() => handleAction("lock", "Lock")}
                  disabled={actionLoading}
                >
                  <Lock size={20} color="#8E8E93" />
                  <Text style={styles.actionButtonText}>Lock User</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.unsuspendButton]}
                  onPress={() => handleAction("unlock", "Unlock")}
                  disabled={actionLoading}
                >
                  <Unlock size={20} color={Colors.success} />
                  <Text style={styles.actionButtonText}>Unlock User</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleAction("delete", "Delete")}
                disabled={actionLoading}
              >
                <Trash2 size={20} color={Colors.error} />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete User</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Activity Logs Tab */
          <View style={styles.logsContainer}>
            {logsLoading ? (
              <View style={styles.logsLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading activity logs...</Text>
              </View>
            ) : activityLogs.length === 0 ? (
              <View style={styles.emptyLogsContainer}>
                <History size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No activity logs found</Text>
                <Text style={styles.emptySubtext}>Activity history will appear here</Text>
              </View>
            ) : (
              activityLogs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logIcon}>
                    {log.type === "verify" && <UserCheck size={20} color={Colors.success} />}
                    {log.type === "suspend" && <Ban size={20} color={Colors.warning} />}
                    {log.type === "profile_update" && <RefreshCw size={20} color={Colors.primary} />}
                    {!["verify", "suspend", "profile_update"].includes(log.type) && (
                      <History size={20} color={Colors.textSecondary} />
                    )}
                  </View>
                  <View style={styles.logContent}>
                    <Text style={styles.logDescription}>{log.description}</Text>
                    <Text style={styles.logTimestamp}>
                      {new Date(log.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {actionLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Lock User Reason Modal */}
      <Modal
        visible={showLockModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowLockModal(false);
          setLockReason("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lock User Reason</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for locking this user:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason..."
              placeholderTextColor={Colors.textSecondary}
              value={lockReason}
              onChangeText={setLockReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowLockModal(false);
                  setLockReason("");
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLockUser}
                disabled={actionLoading || !lockReason.trim()}
              >
                <Text style={styles.modalButtonTextConfirm}>Lock User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowRoleModal(false);
          setSelectedRole("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change User Role</Text>
            <Text style={styles.modalSubtitle}>
              Current role: <Text style={{ fontWeight: "700" }}>{userDetails?.role || userDetails?.role_code || "N/A"}</Text>
            </Text>
            <Text style={[styles.modalSubtitle, { marginTop: 8 }]}>Select a new role:</Text>

            <ScrollView style={styles.roleListContainer} showsVerticalScrollIndicator={false}>
              {getAvailableRoles(user?.role).map((role) => {
                const isSelected = selectedRole === role.code;
                const isCurrentRole = (userDetails?.role || userDetails?.role_code || "").toUpperCase() === role.code;
                return (
                  <TouchableOpacity
                    key={role.code}
                    style={[
                      styles.roleOption,
                      isSelected && styles.roleOptionSelected,
                      isCurrentRole && styles.roleOptionCurrent,
                    ]}
                    onPress={() => setSelectedRole(role.code)}
                    disabled={isCurrentRole}
                  >
                    <View style={styles.roleOptionContent}>
                      <Shield size={18} color={isSelected ? Colors.primary : Colors.textSecondary} />
                      <View style={styles.roleOptionText}>
                        <Text style={[styles.roleOptionLabel, isSelected && styles.roleOptionLabelSelected]}>
                          {role.label}
                        </Text>
                        <Text style={styles.roleOptionCode}>{role.code}</Text>
                      </View>
                    </View>
                    {isSelected && <CheckCircle size={20} color={Colors.primary} />}
                    {isCurrentRole && (
                      <Text style={styles.currentRoleBadge}>Current</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {getAvailableRoles(user?.role).length === 0 && (
              <View style={styles.noRolesContainer}>
                <AlertCircle size={24} color={Colors.textSecondary} />
                <Text style={styles.noRolesText}>{"You don't have permission to change roles"}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowRoleModal(false);
                  setSelectedRole("");
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (!selectedRole || selectedRole === (userDetails?.role || userDetails?.role_code || "")) && styles.modalButtonDisabled,
                ]}
                onPress={handleRoleChange}
                disabled={actionLoading || !selectedRole || selectedRole === (userDetails?.role || userDetails?.role_code || "") || getAvailableRoles(user?.role).length === 0}
              >
                <Text style={styles.modalButtonTextConfirm}>Change Role</Text>
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
  scrollView: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
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
    marginBottom: 8,
  },
  unauthorizedSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  headerSection: {
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingVertical: 8,
  },
  historyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
  },
  verifyButton: {
    backgroundColor: Colors.success + "15",
    borderColor: Colors.success,
  },
  suspendButton: {
    backgroundColor: Colors.warning + "15",
    borderColor: Colors.warning,
  },
  unsuspendButton: {
    backgroundColor: Colors.success + "15",
    borderColor: Colors.success,
  },
  deleteButton: {
    backgroundColor: Colors.error + "15",
    borderColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  logsContainer: {
    padding: 16,
  },
  logsLoadingContainer: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyLogsContainer: {
    padding: 32,
    alignItems: "center",
  },
  logItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logIcon: {
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logDescription: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
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
  modalButtonDisabled: {
    opacity: 0.5,
  },
  roleListContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleOptionSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  roleOptionCurrent: {
    opacity: 0.6,
  },
  roleOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  roleOptionText: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  roleOptionLabelSelected: {
    color: Colors.primary,
  },
  roleOptionCode: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  currentRoleBadge: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  noRolesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    marginBottom: 20,
  },
  noRolesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
