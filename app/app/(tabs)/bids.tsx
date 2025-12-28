import { Bid, BidStatus } from "@/types";
import { useBids } from "@/contexts/BidsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Stack, useRouter } from "expo-router";
import { Calendar, FileText, Plus, Users, X } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { bidsAPI, projectsAPI } from "@/services/api";

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

const STATUS_FILTERS: (BidStatus | "all")[] = ["all", "pending", "submitted", "awarded", "declined"];

const STATUS_LABELS: Record<BidStatus | "all", string> = {
  all: "All",
  pending: "Pending",
  submitted: "Submitted",
  awarded: "Awarded",
  declined: "Declined",
};

interface BidCardProps {
  bid: Bid;
  onPress: () => void;
  submissionsCount: number;
  colors: any;
}

function BidCard({ bid, onPress, submissionsCount, colors }: BidCardProps) {
  const statusColors: Record<BidStatus, string> = {
    pending: colors.warning,
    submitted: colors.info,
    awarded: colors.success,
    declined: colors.error,
  };

  const daysUntilDue = Math.ceil(
    (new Date(bid.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity style={[styles.bidCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.bidHeader}>
        <View style={styles.bidTitleSection}>
          <Text style={[styles.bidTitle, { color: colors.text }]} numberOfLines={1}>
            {bid.projectName}
          </Text>
          <Text style={[styles.bidDate, { color: colors.textTertiary }]}>
            Created {new Date(bid.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.bidStatus,
            { backgroundColor: statusColors[bid.status] + "15" },
          ]}
        >
          <Text style={[styles.bidStatusText, { color: statusColors[bid.status] }]}>
            {STATUS_LABELS[bid.status]}
          </Text>
        </View>
      </View>

      <Text style={[styles.bidDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {bid.description}
      </Text>

      {bid.budget && (
        <View style={styles.budgetRow}>
          <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>Budget:</Text>
          <Text style={[styles.budgetValue, { color: colors.text }]}>{bid.budget}</Text>
        </View>
      )}

      <View style={[styles.bidMetrics, { borderTopColor: colors.border }]}>
        <View style={styles.metricItem}>
          <Users size={16} color={colors.textSecondary} />
          <Text style={[styles.metricText, { color: colors.textSecondary }]}>
            {submissionsCount}/{bid.contractorCount} Bids
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={[styles.metricText, { color: colors.textSecondary }]}>
            {daysUntilDue > 0 ? `${daysUntilDue} days left` : "Overdue"}
          </Text>
        </View>
      </View>

      {submissionsCount > 0 && (
        <View style={[styles.submissionsSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.submissionsTitle, { color: colors.primary }]}>
            {submissionsCount} submission{submissionsCount > 1 ? 's' : ''} received
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function BidsScreen() {
  const router = useRouter();
  const { user, colors } = useAuth();
  const { bids, refreshBids, isLoading } = useBids();
  const [selectedStatus, setSelectedStatus] = useState<BidStatus | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshBids();
    setRefreshing(false);
  }, [refreshBids]);

  // Visible for PM and GC only (hide for VIEWER), Admin sees everything
  const isAdmin = user?.role === "ADMIN";
  const canCreateBids = user?.role === "PM" || user?.role === "GC" || isAdmin;

  const filteredBids = bids.filter((bid) => {
    if (selectedStatus === "all") return true;
    return bid.status === selectedStatus;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Bids",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
          headerRight: () =>
            // Visible for PM and GC only (hide for VIEWER)
            canCreateBids && user?.role !== "VIEWER" ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <View style={[styles.filtersSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {STATUS_FILTERS.map((status) => {
            const count =
              status === "all"
                ? bids.length
                : bids.filter((b) => b.status === status).length;

            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  selectedStatus === status && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    selectedStatus === status && [styles.filterChipTextActive, { color: colors.surface }],
                  ]}
                >
                  {STATUS_LABELS[status]} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Loading bids...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBids}
          renderItem={({ item }) => (
            <BidCard
              bid={item}
              submissionsCount={item.submittedCount}
              colors={colors}
              onPress={() => router.push(`/bid-details?id=${item.id}`)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No bids found</Text>
              <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
                {canCreateBids ? "Tap the + button to create your first bid" : "Check back later for new bids"}
              </Text>
            </View>
          }
        />
      )}

      <CreateBidModal
        visible={showCreateModal}
        colors={colors}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refreshBids}
      />
    </View>
  );
}

function CreateBidModal({
  visible,
  onClose,
  onSuccess,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  colors: any;
}) {
  const { createBid: contextCreateBid } = useBids();
  const [formData, setFormData] = useState({
    projectId: "",
    projectName: "",
    description: "",
    dueDate: "",
    budget: "",
    contractorCount: "5",
  });
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Fetch available projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await projectsAPI.getAll();
        if (response.success && response.data) {
          setProjects(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("[API] Failed to fetch projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };
    if (visible) {
      fetchProjects();
    }
  }, [visible]);

  const handleSubmit = async () => {
    // Backend requires: project_id (UUID) and amount (number)
    // The form should allow selecting an existing project or creating one first
    if (!formData.projectName || !formData.description || !formData.dueDate) return;

    setSubmitting(true);
    try {
      console.log("[API] POST /bids", formData);

      // NOTE: The backend expects project_id (UUID) and amount (number)
      // This form is creating a bid request, which might need to:
      // 1. First create a project, then create a bid for it, OR
      // 2. Select an existing project
      // For now, we'll try to extract amount from budget and use a placeholder project_id
      // TODO: Update UI to require project selection or project creation first

      // Extract numeric amount from budget string (e.g., "1000$" -> 1000)
      const budgetMatch = formData.budget?.match(/(\d+)/);
      const amount = budgetMatch ? parseFloat(budgetMatch[1]) : 0;

      if (!amount || amount <= 0) {
        Alert.alert("Error", "Please enter a valid budget amount (e.g., $1000)");
        setSubmitting(false);
        return;
      }

      // Map frontend bid format to backend format
      const backendData = {
        project_id: formData.projectId || null,
        title: formData.projectName,
        description: formData.description,
        due_date: formData.dueDate,
        amount: amount, // Still passing it, backend might ignore or we can update schema
      };

      // If no project_id, try to create a project first, then create bid
      if (!backendData.project_id) {
        // Try to create a project first with the form data
        try {
          console.log("[API] Creating project first, then bid");
          const projectPayload = {
            title: formData.projectName,
            description: formData.description,
            budget: amount,
          };
          console.log("[API] Project payload:", projectPayload);

          const projectResponse = await projectsAPI.create(projectPayload);

          console.log("[API] Project response:", projectResponse);

          if (projectResponse.success && projectResponse.data) {
            const projectId = projectResponse.data.id || projectResponse.data.project_id;
            console.log("[API] Project created with ID:", projectId);

            if (projectId) {
              backendData.project_id = projectId;
            } else {
              console.error("[API] Project response missing ID:", projectResponse.data);
              Alert.alert(
                "Error",
                "Project was created but ID is missing. Please try again.",
                [{ text: "OK" }]
              );
              setSubmitting(false);
              return;
            }
          } else {
            console.error("[API] Project creation failed:", projectResponse);
            Alert.alert(
              "Project Required",
              "Please select an existing project first, or create a new project before creating a bid.",
              [{ text: "OK" }]
            );
            setSubmitting(false);
            return;
          }
        } catch (projectError: any) {
          console.error("[API] Project creation error:", projectError);
          console.error("[API] Error response:", projectError.response?.data);
          const errorMessage = projectError.response?.data?.message || projectError.message || "Failed to create project.";
          Alert.alert(
            "Error",
            `${errorMessage} Please select an existing project or try again.`,
            [{ text: "OK" }]
          );
          setSubmitting(false);
          return;
        }
      }

      console.log("[API] Creating bid with data:", backendData);
      const response = await bidsAPI.create(backendData);
      console.log("[API] Bid creation response:", response);

      if (response.success) {
        Alert.alert("Success", "Bid created successfully!");
        setFormData({
          projectId: "",
          projectName: "",
          description: "",
          dueDate: "",
          budget: "",
          contractorCount: "5",
        });
        onClose();
        // Trigger parent refresh
        if (onSuccess) {
          onSuccess();
        }
      } else {
        Alert.alert("Error", response.message || "Failed to create bid");
      }
    } catch (error: any) {
      console.error("[API] Failed to create bid:", error);
      Alert.alert("Error", error.response?.data?.message || error.message || "Failed to create bid. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Bid</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Select Project (or create new) *</Text>
            {loadingProjects ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View>
                {projects.length > 0 && (
                  <View style={styles.projectSelector}>
                    {projects.map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[
                          styles.projectOption,
                          { backgroundColor: colors.background, borderColor: colors.border },
                          formData.projectId === project.id && [styles.projectOptionSelected, { backgroundColor: colors.primary + "20", borderColor: colors.primary }],
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            projectId: project.id,
                            projectName: project.title || project.name || "",
                          })
                        }
                      >
                        <Text style={[styles.projectOptionText, { color: colors.text }]}>
                          {project.title || project.name || project.id}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text style={[styles.label, { color: colors.text }]}>Or create new project:</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g., Downtown Office Renovation"
                  value={formData.projectName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, projectName: text, projectId: "" })
                  }
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe the project scope and requirements..."
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Due Date *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="YYYY-MM-DD"
              value={formData.dueDate}
              onChangeText={(text) =>
                setFormData({ ...formData, dueDate: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Bid Amount *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 250000 (numeric amount only)"
              value={formData.budget}
              onChangeText={(text) =>
                setFormData({ ...formData, budget: text })
              }
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              Enter the bid amount as a number (e.g., 250000 for $250,000)
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Number of Contractors to Invite</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="5"
              value={formData.contractorCount}
              onChangeText={(text) =>
                setFormData({ ...formData, contractorCount: text })
              }
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || (!formData.projectId && !formData.projectName) || !formData.budget}
          >
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Creating..." : "Create Bid"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  addButton: {
    padding: 8,
  },
  filtersSection: {
    backgroundColor: staticColors.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: staticColors.background,
    borderWidth: 1,
    borderColor: staticColors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: staticColors.primary,
    borderColor: staticColors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  filterChipTextActive: {
    color: staticColors.surface,
  },
  listContent: {
    padding: 16,
  },
  bidCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  bidHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 12,
  },
  bidTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  bidTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  bidDate: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  bidStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bidStatusText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  bidDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginRight: 8,
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  bidMetrics: {
    flexDirection: "row" as const,
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    color: staticColors.textSecondary,
    fontWeight: "500" as const,
  },
  submissionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
  },
  submissionsTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
    backgroundColor: staticColors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: staticColors.text,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  projectSelector: {
    marginBottom: 12,
    gap: 8,
  },
  projectOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: staticColors.background,
    borderWidth: 1,
    borderColor: staticColors.border,
    marginBottom: 8,
  },
  projectOptionSelected: {
    backgroundColor: staticColors.primary + "20",
    borderColor: staticColors.primary,
  },
  projectOptionText: {
    fontSize: 14,
    color: staticColors.text,
    fontWeight: "500" as const,
  },
  helperText: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginTop: 4,
    fontStyle: "italic",
  },
});
