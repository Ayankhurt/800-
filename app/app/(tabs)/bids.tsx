import Colors from "@/constants/colors";
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
} from "react-native";
import { bidsAPI, projectsAPI } from "@/services/api";

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
}

function BidCard({ bid, onPress, submissionsCount }: BidCardProps) {
  const statusColors: Record<BidStatus, string> = {
    pending: Colors.warning,
    submitted: Colors.info,
    awarded: Colors.success,
    declined: Colors.error,
  };

  const daysUntilDue = Math.ceil(
    (new Date(bid.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity style={styles.bidCard} onPress={onPress}>
      <View style={styles.bidHeader}>
        <View style={styles.bidTitleSection}>
          <Text style={styles.bidTitle} numberOfLines={1}>
            {bid.projectName}
          </Text>
          <Text style={styles.bidDate}>
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

      <Text style={styles.bidDescription} numberOfLines={2}>
        {bid.description}
      </Text>

      {bid.budget && (
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Budget:</Text>
          <Text style={styles.budgetValue}>{bid.budget}</Text>
        </View>
      )}

      <View style={styles.bidMetrics}>
        <View style={styles.metricItem}>
          <Users size={16} color={Colors.textSecondary} />
          <Text style={styles.metricText}>
            {submissionsCount}/{bid.contractorCount} Bids
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Calendar size={16} color={Colors.textSecondary} />
          <Text style={styles.metricText}>
            {daysUntilDue > 0 ? `${daysUntilDue} days left` : "Overdue"}
          </Text>
        </View>
      </View>

      {submissionsCount > 0 && (
        <View style={styles.submissionsSection}>
          <Text style={styles.submissionsTitle}>
            {submissionsCount} submission{submissionsCount > 1 ? 's' : ''} received
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function BidsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bids: contextBids, getSubmissionsByBidId, isLoading: contextLoading } = useBids();
  const [apiBids, setApiBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<BidStatus | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch bids from API
  useEffect(() => {
    const fetchBids = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        console.log("[API] GET /bids");
        const response = await bidsAPI.getAll();

        if (response.success && response.data) {
          // Handle both array response and object response { bids: [], total: 0 }
          const rawData = response.data.bids || (Array.isArray(response.data) ? response.data : []);

          // Map backend bid format to frontend Bid type
          const mappedBids = rawData.map((bid: any) => ({
            id: bid.id || bid.bid_id,
            projectName: bid.project?.title || bid.project_name || bid.projectName || bid.title || "Unnamed Project",
            description: bid.notes || bid.description || "No description provided",
            dueDate: bid.due_date || bid.dueDate || bid.created_at,
            status: (bid.status || "pending") as BidStatus,
            budget: bid.amount ? `$${bid.amount}` : (bid.budget || "TBD"),
            contractorCount: bid.contractor_count || bid.contractorCount || 0,
            submittedCount: bid.submitted_count || bid.submittedCount || 0,
            createdAt: bid.created_at || bid.createdAt,
          }));
          setApiBids(mappedBids);
        }
      } catch (error: any) {
        console.error("[API] Failed to fetch bids:", error);
        Alert.alert("Error", "Failed to load bids. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBids();
  }, [user]);

  // Use API bids if available, otherwise fallback to context bids
  const bids = apiBids.length > 0 ? apiBids : contextBids;

  // Visible for PM and GC only (hide for VIEWER), Admin sees everything
  const isAdmin = user?.role === "ADMIN";
  const canCreateBids = user?.role === "PM" || user?.role === "GC" || isAdmin;

  const filteredBids = bids.filter((bid) => {
    if (selectedStatus === "all") return true;
    return bid.status === selectedStatus;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Bids",
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTitleStyle: {
            color: Colors.text,
            fontWeight: "700" as const,
          },
          headerRight: () =>
            // Visible for PM and GC only (hide for VIEWER)
            canCreateBids && user?.role !== "VIEWER" ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={24} color={Colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <View style={styles.filtersSection}>
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
                  selectedStatus === status && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStatus === status && styles.filterChipTextActive,
                  ]}
                >
                  {STATUS_LABELS[status]} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Loading bids...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBids}
          renderItem={({ item }) => (
            <BidCard
              bid={item}
              submissionsCount={item.submittedCount}
              onPress={() => router.push(`/bid-details?id=${item.id}`)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyStateTitle}>No bids found</Text>
              <Text style={styles.emptyStateDescription}>
                {canCreateBids ? "Tap the + button to create your first bid" : "Check back later for new bids"}
              </Text>
            </View>
          }
        />
      )}

      <CreateBidModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          // Refresh bids list
          const fetchBids = async () => {
            setIsLoading(true);
            try {
              const response = await bidsAPI.getAll();
              if (response.success && response.data) {
                const rawData = response.data.bids || (Array.isArray(response.data) ? response.data : []);
                const mappedBids = rawData.map((bid: any) => ({
                  id: bid.id || bid.bid_id,
                  projectName: bid.project?.title || bid.project_name || bid.projectName || bid.title || "Unnamed Project",
                  description: bid.notes || bid.description || "No description provided",
                  dueDate: bid.due_date || bid.dueDate || bid.created_at,
                  status: (bid.status || "pending") as BidStatus,
                  budget: bid.amount ? `$${bid.amount}` : (bid.budget || "TBD"),
                  contractorCount: bid.contractor_count || bid.contractorCount || 0,
                  submittedCount: bid.submitted_count || bid.submittedCount || 0,
                  createdAt: bid.created_at || bid.createdAt,
                }));
                setApiBids(mappedBids);
              }
            } catch (error) {
              console.error("[API] Failed to refresh bids:", error);
            } finally {
              setIsLoading(false);
            }
          };
          fetchBids();
        }}
      />
    </View>
  );
}

function CreateBidModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
          const projectResponse = await projectsAPI.create({
            title: formData.projectName,
            description: formData.description,
            budget: amount,
          });

          if (projectResponse.success && projectResponse.data?.id) {
            backendData.project_id = projectResponse.data.id;
          } else {
            Alert.alert(
              "Project Required",
              "Please select an existing project first, or create a new project before creating a bid.",
              [{ text: "OK" }]
            );
            setSubmitting(false);
            return;
          }
        } catch (projectError: any) {
          Alert.alert(
            "Error",
            "Failed to create project. Please select an existing project or try again.",
            [{ text: "OK" }]
          );
          setSubmitting(false);
          return;
        }
      }

      const response = await bidsAPI.create(backendData);

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
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New Bid</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Project (or create new) *</Text>
            {loadingProjects ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <View>
                {projects.length > 0 && (
                  <View style={styles.projectSelector}>
                    {projects.map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[
                          styles.projectOption,
                          formData.projectId === project.id && styles.projectOptionSelected,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            projectId: project.id,
                            projectName: project.title || project.name || "",
                          })
                        }
                      >
                        <Text style={styles.projectOptionText}>
                          {project.title || project.name || project.id}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text style={styles.label}>Or create new project:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Downtown Office Renovation"
                  value={formData.projectName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, projectName: text, projectId: "" })
                  }
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the project scope and requirements..."
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Due Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.dueDate}
              onChangeText={(text) =>
                setFormData({ ...formData, dueDate: text })
              }
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bid Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 250000 (numeric amount only)"
              value={formData.budget}
              onChangeText={(text) =>
                setFormData({ ...formData, budget: text })
              }
              keyboardType="numeric"
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.helperText}>
              Enter the bid amount as a number (e.g., 250000 for $250,000)
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Number of Contractors to Invite</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              value={formData.contractorCount}
              onChangeText={(text) =>
                setFormData({ ...formData, contractorCount: text })
              }
              keyboardType="numeric"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || (!formData.projectId && !formData.projectName) || !formData.budget}
          >
            <Text style={styles.submitButtonText}>
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
    backgroundColor: Colors.background,
  },
  addButton: {
    padding: 8,
  },
  filtersSection: {
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.surface,
  },
  listContent: {
    padding: 16,
  },
  bidCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    marginBottom: 4,
  },
  bidDate: {
    fontSize: 12,
    color: Colors.textTertiary,
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
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
    marginRight: 8,
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  bidMetrics: {
    flexDirection: "row" as const,
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  submissionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submissionsTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
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
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center" as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: Colors.primary,
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
    color: Colors.white,
  },
  projectSelector: {
    marginBottom: 12,
    gap: 8,
  },
  projectOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  projectOptionSelected: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  projectOptionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500" as const,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
    fontStyle: "italic",
  },
});
