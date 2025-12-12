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
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  User,
  AlertCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

interface Dispute {
  id: string;
  project_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_at?: string;
  project?: {
    title?: string;
  };
}

type FilterType = "all" | "open" | "under-review" | "resolved";

export default function DisputesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      console.log("[API] GET /admin/disputes");
      const response = await adminAPI.getAllDisputes();
      const disputesData = response?.data || response || [];
      setDisputes(Array.isArray(disputesData) ? disputesData : []);
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchDisputes();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDisputes();
    setRefreshing(false);
  };

  const filteredDisputes = useMemo(() => {
    let filtered = [...disputes];

    if (selectedFilter !== "all") {
      filtered = filtered.filter((dispute) => {
        const status = dispute.status?.toLowerCase() || "";
        if (selectedFilter === "open") return status === "open" || status === "pending";
        if (selectedFilter === "under-review") return status === "under-review" || status === "reviewing";
        if (selectedFilter === "resolved") return status === "resolved" || status === "closed";
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dispute) =>
          dispute.title?.toLowerCase().includes(query) ||
          dispute.description?.toLowerCase().includes(query) ||
          dispute.project?.title?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [disputes, selectedFilter, searchQuery]);

  const getStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "open" || statusLower === "pending") {
      return { label: "Open", color: Colors.warning, icon: AlertTriangle };
    }
    if (statusLower === "under-review" || statusLower === "reviewing") {
      return { label: "Under Review", color: Colors.info, icon: Clock };
    }
    if (statusLower === "resolved" || statusLower === "closed") {
      return { label: "Resolved", color: Colors.success, icon: CheckCircle };
    }
    return { label: "Unknown", color: Colors.textSecondary, icon: AlertCircle };
  };

  const getPriorityBadge = (priority?: string) => {
    const priorityLower = priority?.toLowerCase() || "";
    if (priorityLower === "high" || priorityLower === "urgent") {
      return { label: "High", color: Colors.error };
    }
    if (priorityLower === "medium") {
      return { label: "Medium", color: Colors.warning };
    }
    return { label: "Low", color: Colors.success };
  };

  const handleDisputePress = (dispute: Dispute) => {
    router.push({
      pathname: "/admin/disputes/dispute-details",
      params: {
        id: dispute.id,
        disputeData: encodeURIComponent(JSON.stringify(dispute)),
      },
    } as any);
  };

  const renderDisputeItem = ({ item }: { item: Dispute }) => {
    const statusBadge = getStatusBadge(item.status);
    const priorityBadge = getPriorityBadge(item.priority);
    const StatusIcon = statusBadge.icon;

    return (
      <TouchableOpacity
        style={styles.disputeCard}
        onPress={() => handleDisputePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.disputeHeader}>
          <View style={styles.disputeTitleRow}>
            <AlertTriangle size={20} color={Colors.warning} />
            <Text style={styles.disputeTitle} numberOfLines={1}>
              {item.title || "Untitled Dispute"}
            </Text>
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityBadge.color + "15", borderColor: priorityBadge.color },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityBadge.color }]}>
              {priorityBadge.label}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.disputeDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.disputeFooter}>
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
          {item.assigned_to && (
            <View style={styles.assignedRow}>
              <User size={12} color={Colors.textSecondary} />
              <Text style={styles.assignedText}>Assigned</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "under-review", label: "Under Review" },
    { key: "resolved", label: "Resolved" },
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

  if (loading && disputes.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: "Dispute Resolution" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading disputes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Dispute Resolution" }} />

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search disputes..."
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
        data={filteredDisputes}
        renderItem={renderDisputeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No disputes found</Text>
          </View>
        }
      />
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
  disputeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disputeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  disputeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  disputeTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  disputeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  disputeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  assignedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assignedText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
});

