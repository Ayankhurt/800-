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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  FolderKanban,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  AlertCircle,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

interface Project {
  id: string;
  title: string;
  description?: string;
  status?: string;
  owner_id?: string;
  contractor_id?: string;
  created_at?: string;
  budget?: number;
  owner?: {
    full_name?: string;
    email?: string;
  };
  contractor?: {
    full_name?: string;
    email?: string;
  };
}

type FilterType = "all" | "pending" | "approved" | "in-progress" | "completed";

export default function ProjectsScreen() {
  const router = useRouter();
  const { user, colors } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  // Role security - only ADMIN can access
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log("[API] GET /projects");
      const response = await adminAPI.getAllProjects();
      const projectsData = response?.data?.projects || response?.projects || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchProjects();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((project) => {
        const status = project.status?.toLowerCase() || "";
        if (selectedFilter === "pending") return status === "pending" || status === "draft";
        if (selectedFilter === "approved") return status === "approved";
        if (selectedFilter === "in-progress") return status === "in-progress" || status === "active";
        if (selectedFilter === "completed") return status === "completed" || status === "done";
        return true;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.owner?.full_name?.toLowerCase().includes(query) ||
          project.contractor?.full_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [projects, selectedFilter, searchQuery]);

  const getStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "pending" || statusLower === "draft") {
      return { label: "Pending", color: colors.warning, icon: Clock };
    }
    if (statusLower === "approved") {
      return { label: "Approved", color: colors.success, icon: CheckCircle };
    }
    if (statusLower === "in-progress" || statusLower === "active") {
      return { label: "In Progress", color: colors.info, icon: Clock };
    }
    if (statusLower === "completed" || statusLower === "done") {
      return { label: "Completed", color: colors.success, icon: CheckCircle };
    }
    return { label: "Unknown", color: colors.textSecondary, icon: AlertCircle };
  };

  const handleProjectPress = (project: Project) => {
    router.push({
      pathname: "/admin/projects/project-details",
      params: {
        id: project.id,
        projectData: encodeURIComponent(JSON.stringify(project)),
      },
    } as any);
  };

  const renderProjectItem = ({ item }: { item: Project }) => {
    const statusBadge = getStatusBadge(item.status);
    const StatusIcon = statusBadge.icon;

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.projectHeader}>
          <View style={styles.projectTitleRow}>
            <FolderKanban size={20} color={colors.primary} />
            <Text style={styles.projectTitle} numberOfLines={1}>
              {item.title || "Untitled Project"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusBadge.color + "15", borderColor: statusBadge.color },
            ]}
          >
            <StatusIcon size={12} color={statusBadge.color} />
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.projectDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.projectFooter}>
          {item.owner && (
            <Text style={styles.projectMeta}>
              Owner: {item.owner.full_name || item.owner.email || "Unknown"}
            </Text>
          )}
          {item.budget && (
            <Text style={styles.projectBudget}>${item.budget.toLocaleString()}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];

  // Block non-admin access
  if (user && user.role !== "ADMIN") {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Unauthorized" }} />
        <View style={styles.unauthorizedContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.unauthorizedText}>Access Denied</Text>
          <Text style={styles.unauthorizedSubtext}>Only Admin users can access this screen.</Text>
        </View>
      </View>
    );
  }

  if (loading && projects.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Project Approval",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Project Approval",
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
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

      {/* Projects List */}
      <FlatList
        data={filteredProjects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FolderKanban size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No projects found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedFilter !== "all"
                ? "Try adjusting your filters"
                : "Projects will appear here"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  projectCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  projectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  projectDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  projectFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projectMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  projectBudget: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
});
