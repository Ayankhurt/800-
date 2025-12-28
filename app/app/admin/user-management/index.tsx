import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Stack, useRouter } from "expo-router";
import {
  Users,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  UserCheck,
  UserX,
  Crown,
  Briefcase,
  Wrench,
  Eye,
  UserPlus,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

interface User {
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
  is_active?: boolean;
  verification_status?: string;
}

type FilterType = "all" | "verified" | "suspended" | "admins" | "gc" | "pm" | "sub" | "viewer";

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

// Get available roles for creating users based on current user's role
const getAvailableRolesForCreate = (currentUserRole: string | undefined) => {
  const role = (currentUserRole || "").toUpperCase();

  // SUPER admin can create ADMIN roles but not SUPER admin roles
  if (role === "SUPER") {
    return ALL_ROLES.filter((r) => r.code !== "SUPER");
  }

  // Regular ADMIN cannot create ADMIN or SUPER roles
  if (role === "ADMIN") {
    return ALL_ROLES.filter((r) => r.code !== "ADMIN" && r.code !== "SUPER");
  }

  // Default: return all roles
  return ALL_ROLES;
};

export default function UserManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users for client-side filtering
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    password: "",
    role: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Available roles for creating users (excluding SUPER for regular ADMIN)
  const availableRolesForCreate = getAvailableRolesForCreate(user?.role);

  // Role security - only ADMIN can access
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  // Fetch users with cursor-based pagination
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchUsers = async (cursorParam: string | null = null, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log(`[UserManagement] Fetching users - cursor: ${cursorParam}, append: ${append}`);

      // Use cursor-based pagination (new format)
      const response = await adminAPI.getAllUsers(undefined, limit, cursorParam);

      console.log(`[UserManagement] API response:`, response);

      // Handle response format: { success: true, data: [...], nextCursor: ..., hasMore: ... }
      // OR old format: { success: true, data: { users: [...], nextCursor: ... } }
      let usersData: any[] = [];
      let hasMoreData = false;
      let nextCursorValue: string | null = null;

      if (response?.success && response?.data) {
        // Check if data is array (new format after extraction in api.ts)
        if (Array.isArray(response.data)) {
          usersData = response.data;
          hasMoreData = response.hasMore || false;
          nextCursorValue = response.nextCursor || null;
        }
        // Check if data.users exists (nested format)
        else if (response.data.users && Array.isArray(response.data.users)) {
          usersData = response.data.users;
          hasMoreData = response.data.hasMore || false;
          nextCursorValue = response.data.nextCursor || null;
        }
        // Fallback: try to use data directly
        else if (Array.isArray(response.data)) {
          usersData = response.data;
        }
      }

      // CRITICAL CHECK: Verify we're getting multiple users
      const uniqueUserIds = [...new Set(usersData.map(u => u.id))];
      const currentUserId = user?.id;
      const includesCurrentUser = usersData.some(u => u.id === currentUserId);

      console.log(`[UserManagement] Received ${usersData.length} users (${uniqueUserIds.length} unique IDs)`);
      console.log(`[UserManagement] Verification - Includes current user (${currentUserId}): ${includesCurrentUser}`);
      console.log(`[UserManagement] Sample user IDs: ${uniqueUserIds.slice(0, 5).join(', ')}`);

      // CRITICAL CHECK: If we only got 1 user and it's the current user, something is wrong
      if (usersData.length === 1 && usersData[0].id === currentUserId) {
        console.error(`[UserManagement] CRITICAL ERROR: API returned only the current user!`);
        console.error(`[UserManagement] This should NOT happen - admin should see ALL users, not just themselves.`);
        Alert.alert(
          "Warning",
          "Only current user returned. Please check backend logs. This may indicate a filtering issue."
        );
      }

      // If response.data is a single user object (from auth/me), ignore it
      if (usersData && !Array.isArray(usersData)) {
        console.warn('[UserManagement] Received non-array data, ignoring:', usersData);
        usersData = [];
      }

      const usersArray = Array.isArray(usersData) ? usersData : [];

      if (append) {
        setUsers((prev) => [...prev, ...usersArray]);
        setAllUsers((prev) => [...prev, ...usersArray]);
      } else {
        setUsers(usersArray);
        setAllUsers(usersArray);
      }

      // Update pagination state
      if (response?.data?.page && response?.data?.pages) {
        setHasMore(response.data.page < response.data.pages);
      } else {
        setHasMore(hasMoreData);
      }
      setNextCursor(nextCursorValue);

      console.log(`[UserManagement] Updated state - Total users: ${usersArray.length}, Has more: ${hasMoreData}, Next cursor: ${nextCursorValue}`);
    } catch (error: any) {
      console.error("[UserManagement] Failed to fetch users:", error);
      if (!append) {
        Alert.alert("Error", error.message || "Failed to load users");
        setUsers([]);
        setAllUsers([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load more users using cursor
  const loadMoreUsers = () => {
    if (nextCursor && !loadingMore) {
      fetchUsers(nextCursor, true);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      // Reset pagination and fetch from beginning
      setNextCursor(null);
      fetchUsers(null, false);
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setNextCursor(null);
    setSearchQuery("");
    setSelectedFilter("all");
    fetchUsers(null, false); // Reset to beginning with cursor-based pagination
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && selectedFilter === "all" && !searchQuery && nextCursor) {
      loadMoreUsers(); // Use cursor-based pagination
    }
  };

  // Debounced search (client-side)
  const debouncedSearch = useMemo(() => {
    let timeout: any;
    return (query: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        filterUsers(query, selectedFilter);
      }, 200);
    };
  }, [selectedFilter]);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Filter users based on search and filter
  const filterUsers = useCallback(
    (query: string, filter: FilterType) => {
      let filtered = [...allUsers];

      // Apply filter
      if (filter !== "all") {
        filtered = filtered.filter((u) => {
          const role = (u.role || u.role_code || "").toLowerCase();
          const status = (u.status || "").toLowerCase();
          const isActive = u.is_active !== undefined ? u.is_active : true;

          switch (filter) {
            case "verified":
              return u.verification_status === "verified";
            case "suspended":
              return isActive === false || status === "suspended" || status === "inactive";
            case "admins":
              return role === "admin" || role === "super_admin";
            case "gc":
              return role === "general_contractor";
            case "pm":
              return role === "project_manager";
            case "sub":
              return role === "subcontractor" || role === "trade_specialist";
            case "viewer":
              return role === "viewer";
            default:
              return true;
          }
        });
      }

      // Apply search
      if (query.trim()) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter((u) => {
          const fullName = (u.fullName || u.full_name || "").toLowerCase();
          const email = (u.email || "").toLowerCase();
          const phone = (u.phone || "").toLowerCase();
          const role = (u.role || u.role_code || "").toLowerCase();
          const status = (u.status || "").toLowerCase();

          return (
            fullName.includes(lowerQuery) ||
            email.includes(lowerQuery) ||
            phone.includes(lowerQuery) ||
            role.includes(lowerQuery) ||
            status.includes(lowerQuery)
          );
        });
      }

      setUsers(filtered);
    },
    [allUsers]
  );

  useEffect(() => {
    filterUsers(searchQuery, selectedFilter);
  }, [selectedFilter, filterUsers]);

  const handleUserPress = (userItem: User) => {
    const userDataParam = encodeURIComponent(JSON.stringify(userItem));
    router.push(`/admin/user-management/user-details?id=${userItem.id}&userData=${userDataParam}` as any);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allUsers.length;
    const verified = allUsers.filter((u) => u.verification_status === "verified").length;
    const suspended = allUsers.filter((u) => {
      const status = (u.status || "").toLowerCase();
      const isActive = u.is_active !== undefined ? u.is_active : false;
      return isActive === false || status === "suspended" || status === "inactive";
    }).length;
    const admins = allUsers.filter((u) => {
      const role = (u.role || u.role_code || "").toLowerCase();
      return role === "admin" || role === "super_admin";
    }).length;
    const contractors = allUsers.filter((u) => {
      const role = (u.role || u.role_code || "").toLowerCase();
      return role === "general_contractor" || role === "subcontractor" || role === "trade_specialist";
    }).length;
    const pms = allUsers.filter((u) => {
      const role = (u.role || u.role_code || "").toLowerCase();
      return role === "project_manager";
    }).length;

    return { total, verified, suspended, admins, contractors, pms };
  }, [allUsers]);

  // Get role badge with professional colors
  const getRoleBadge = (user: User) => {
    const role = (user.role || user.role_code || "user").toLowerCase();
    let badgeStyle: any = {};
    let textStyle: any = {};
    let iconColor = Colors.primary;
    let label = role.toUpperCase();

    if (role === "admin" || role === "super_admin") {
      badgeStyle = { backgroundColor: Colors.error + "15", borderColor: Colors.error };
      textStyle = { color: Colors.error };
      iconColor = Colors.error;
      label = role === "super_admin" ? "SUPER ADMIN" : "ADMIN";
    } else if (role === "general_contractor") {
      badgeStyle = { backgroundColor: "#FF9500" + "15", borderColor: "#FF9500" };
      textStyle = { color: "#FF9500" };
      iconColor = "#FF9500";
      label = "GC";
    } else if (role === "project_manager") {
      badgeStyle = { backgroundColor: "#007AFF" + "15", borderColor: "#007AFF" };
      textStyle = { color: "#007AFF" };
      iconColor = "#007AFF";
      label = "PM";
    } else if (role === "subcontractor" || role === "trade_specialist") {
      badgeStyle = { backgroundColor: "#AF52DE" + "15", borderColor: "#AF52DE" };
      textStyle = { color: "#AF52DE" };
      iconColor = "#AF52DE";
      label = role === "subcontractor" ? "SUB" : "TS";
    } else if (role === "viewer") {
      badgeStyle = { backgroundColor: "#5AC8FA" + "15", borderColor: "#5AC8FA" };
      textStyle = { color: "#5AC8FA" };
      iconColor = "#5AC8FA";
      label = "VIEWER";
    } else {
      badgeStyle = { backgroundColor: Colors.primaryLight };
      textStyle = { color: Colors.primary };
    }

    return (
      <View style={[styles.roleBadge, badgeStyle]}>
        <Shield size={12} color={iconColor} />
        <Text style={[styles.roleText, textStyle]}>{label}</Text>
      </View>
    );
  };

  // Get status badge with professional colors
  const getStatusBadge = (user: User) => {
    const status = (user.status || "").toLowerCase();
    const isActive = user.is_active !== undefined ? user.is_active : true;
    const isVerified = user.verification_status === "verified";

    if (isActive === false || status === "suspended" || status === "inactive") {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#8E8E93" + "15", borderColor: "#8E8E93" }]}>
          <XCircle size={12} color="#8E8E93" />
          <Text style={[styles.statusText, { color: "#8E8E93" }]}>SUSPENDED</Text>
        </View>
      );
    }

    if (isVerified) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: Colors.success + "15", borderColor: Colors.success }]}>
          <CheckCircle size={12} color={Colors.success} />
          <Text style={[styles.statusText, { color: Colors.success }]}>VERIFIED</Text>
        </View>
      );
    }

    return null;
  };

  // Handle verify user
  const handleVerifyUser = async (userId: string, userEmail: string) => {
    Alert.alert(
      "Verify User",
      `Are you sure you want to verify ${userEmail}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify",
          style: "default",
          onPress: async () => {
            try {
              console.log("[UserManagement] Calling verifyUser API...");
              const response = await adminAPI.verifyUser(userId);
              console.log("[UserManagement] verifyUser response:", response);

              if (response.success) {
                Alert.alert("Success", "User verified successfully", [
                  {
                    text: "OK",
                    onPress: () => {
                      // Refresh users list
                      setNextCursor(null);
                      fetchUsers(null, false);
                    },
                  },
                ]);
              } else {
                Alert.alert("Error", response.message || "Failed to verify user");
              }
            } catch (error: any) {
              console.error("[UserManagement] Failed to verify user:", error);
              let errorMessage = "Failed to verify user";
              if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                if (data?.message) {
                  errorMessage = data.message;
                } else if (status === 403) {
                  errorMessage = "You don't have permission to verify users.";
                } else if (status === 401) {
                  errorMessage = "Authentication failed. Please login again.";
                } else if (status >= 500) {
                  errorMessage = "Server error. Please try again later.";
                }
              } else if (error.message) {
                errorMessage = error.message;
              }
              Alert.alert("Error", errorMessage);
            }
          },
        },
      ]
    );
  };

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => {
      const fullName = item.fullName || item.full_name || "Unknown User";
      const isVerified = item.verification_status === "verified";

      return (
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => handleUserPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.userCardHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{fullName}</Text>
              <View style={styles.userMeta}>
                <Mail size={14} color={Colors.textSecondary} />
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              {item.phone && (
                <View style={styles.userMeta}>
                  <Phone size={14} color={Colors.textSecondary} />
                  <Text style={styles.userPhone}>{item.phone}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.userCardFooter}>
            <View style={styles.badgesContainer}>
              {getRoleBadge(item)}
              {getStatusBadge(item)}
            </View>
            {!isVerified && (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleVerifyUser(item.id, item.email);
                }}
              >
                <UserCheck size={14} color={Colors.success} />
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    []
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  // Handle create user
  const handleCreateUser = async () => {
    if (!createUserData.fullName || !createUserData.email || !createUserData.password || !createUserData.role) {
      Alert.alert("Error", "Please fill in all required fields (Name, Email, Password, Role)");
      return;
    }

    // Check if user can create users
    if (availableRolesForCreate.length === 0) {
      Alert.alert("Permission Denied", "You don't have permission to create users.");
      return;
    }

    // Check if selected role is allowed
    const currentUserRole = (user?.role || "").toString().toUpperCase();
    if (currentUserRole === "ADMIN" && (createUserData.role === "SUPER" || createUserData.role === "ADMIN")) {
      Alert.alert("Permission Denied", "You cannot create Admin or Super Admin users.");
      return;
    }

    // Prevent SUPER admin from creating SUPER admin users
    if (currentUserRole === "SUPER" && createUserData.role === "SUPER") {
      Alert.alert("Permission Denied", "You cannot create Super Admin users.");
      return;
    }

    Alert.alert(
      "Confirm Create User",
      `Are you sure you want to create a new user with role ${createUserData.role}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create User",
          style: "default",
          onPress: async () => {
            try {
              setCreateLoading(true);
              console.log("[UserManagement] Calling createUser API...");
              const response = await adminAPI.createUser({
                fullName: createUserData.fullName,
                email: createUserData.email,
                phone: createUserData.phone || undefined,
                companyName: createUserData.companyName || undefined,
                password: createUserData.password,
                role: createUserData.role,
              });
              console.log("[UserManagement] createUser response:", response);

              Alert.alert("Success", "User created successfully", [
                {
                  text: "OK",
                  onPress: () => {
                    setShowCreateModal(false);
                    setCreateUserData({
                      fullName: "",
                      email: "",
                      phone: "",
                      companyName: "",
                      password: "",
                      role: "",
                    });
                    setNextCursor(null);
                    fetchUsers(null, false);
                  },
                },
              ]);
            } catch (createError: any) {
              console.error("[UserManagement] Failed to create user:", createError);
              let errorMessage = "Failed to create user";
              if (createError.response) {
                const status = createError.response.status;
                const data = createError.response.data;
                if (data?.message) {
                  errorMessage = data.message;
                } else if (status === 403) {
                  errorMessage = "You don't have permission to create users.";
                } else if (status === 401) {
                  errorMessage = "Authentication failed. Please login again.";
                } else if (status >= 500) {
                  errorMessage = "Server error. Please try again later.";
                }
              } else if (createError.message) {
                errorMessage = createError.message;
              }
              Alert.alert("Error", errorMessage);
            } finally {
              setCreateLoading(false);
            }
          },
        },
      ]
    );
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "User Management",
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTitleStyle: {
            color: Colors.text,
            fontWeight: "700" as const,
          },
        }}
      />

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.success + "15" }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.verified}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#8E8E93" + "15" }]}>
            <Text style={[styles.statValue, { color: "#8E8E93" }]}>{stats.suspended}</Text>
            <Text style={styles.statLabel}>Suspended</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.error + "15" }]}>
            <Text style={[styles.statValue, { color: Colors.error }]}>{stats.admins}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FF9500" + "15" }]}>
            <Text style={[styles.statValue, { color: "#FF9500" }]}>{stats.contractors}</Text>
            <Text style={styles.statLabel}>Contractors</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#007AFF" + "15" }]}>
            <Text style={[styles.statValue, { color: "#007AFF" }]}>{stats.pms}</Text>
            <Text style={styles.statLabel}>PMs</Text>
          </View>
        </ScrollView>
      </View>

      {/* Search Bar and Create User Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, phone, role..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {availableRolesForCreate.length > 0 && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.7}
          >
            <UserPlus size={18} color={Colors.white} />
            <Text style={styles.createButtonText} numberOfLines={1}>
              Create
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {[
          { key: "all", label: "All", icon: Users },
          { key: "verified", label: "Verified", icon: UserCheck },
          { key: "suspended", label: "Suspended", icon: UserX },
          { key: "admins", label: "Admins", icon: Crown },
          { key: "gc", label: "GC", icon: Briefcase },
          { key: "pm", label: "PM", icon: Briefcase },
          { key: "sub", label: "Subs/TS", icon: Wrench },
          { key: "viewer", label: "Viewers", icon: Eye },
        ].map((filter) => {
          const Icon = filter.icon;
          const isActive = selectedFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.key as FilterType)}
            >
              <Icon size={14} color={isActive ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User List */}
      {loading && page === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            {searchQuery || selectedFilter !== "all" ? "No users match your filters" : "No users found"}
          </Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          windowSize={10}
        />
      )}

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          setCreateUserData({
            fullName: "",
            email: "",
            phone: "",
            companyName: "",
            password: "",
            role: "",
          });
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Create New User</Text>

            <Text style={styles.modalLabel}>Full Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter full name"
              placeholderTextColor={Colors.textSecondary}
              value={createUserData.fullName}
              onChangeText={(text) => setCreateUserData({ ...createUserData, fullName: text })}
            />

            <Text style={styles.modalLabel}>Email *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter email"
              placeholderTextColor={Colors.textSecondary}
              value={createUserData.email}
              onChangeText={(text) => setCreateUserData({ ...createUserData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>Phone</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter phone number"
              placeholderTextColor={Colors.textSecondary}
              value={createUserData.phone}
              onChangeText={(text) => setCreateUserData({ ...createUserData, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.modalLabel}>Company Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter company name"
              placeholderTextColor={Colors.textSecondary}
              value={createUserData.companyName}
              onChangeText={(text) => setCreateUserData({ ...createUserData, companyName: text })}
            />

            <Text style={styles.modalLabel}>Password *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter password"
              placeholderTextColor={Colors.textSecondary}
              value={createUserData.password}
              onChangeText={(text) => setCreateUserData({ ...createUserData, password: text })}
              secureTextEntry
            />

            <Text style={styles.modalLabel}>Role *</Text>
            <ScrollView style={styles.roleListContainer} showsVerticalScrollIndicator={false}>
              {availableRolesForCreate.map((role) => {
                const isSelected = createUserData.role === role.code;
                return (
                  <TouchableOpacity
                    key={role.code}
                    style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                    onPress={() => setCreateUserData({ ...createUserData, role: role.code })}
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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {availableRolesForCreate.length === 0 && (
              <View style={styles.noRolesContainer}>
                <AlertCircle size={24} color={Colors.textSecondary} />
                <Text style={styles.noRolesText}>{"You don't have permission to create users"}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowCreateModal(false);
                  setCreateUserData({
                    fullName: "",
                    email: "",
                    phone: "",
                    companyName: "",
                    password: "",
                    role: "",
                  });
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (!createUserData.fullName || !createUserData.email || !createUserData.password || !createUserData.role) && styles.modalButtonDisabled,
                ]}
                onPress={handleCreateUser}
                disabled={createLoading || !createUserData.fullName || !createUserData.email || !createUserData.password || !createUserData.role || availableRolesForCreate.length === 0}
              >
                {createLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  statsContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  statsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    minWidth: 90,
    maxWidth: 120,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    minWidth: 200,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.success + "15",
    borderWidth: 1,
    borderColor: Colors.success,
    gap: 6,
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.success,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700" as const,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    minWidth: 80,
    flexShrink: 0,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600" as const,
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
    padding: 20,
    width: "95%",
    maxWidth: 500,
    maxHeight: "90%",
    marginHorizontal: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
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
  modalButtonDisabled: {
    opacity: 0.5,
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
  roleListContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
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
    fontSize: 14,
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
  noRolesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    marginBottom: 12,
  },
  noRolesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
