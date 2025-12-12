import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  TrendingUp,
  XCircle,
} from "lucide-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useProjects } from "@/contexts/ProjectsContext";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI, projectsAPI, milestonesAPI } from "@/services/api";

export default function ProjectDashboardScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const {
    getProjectById,
    getScopeByProjectId,
    getContractByProjectId,
    getMilestonesByProjectId,
    getProgressUpdatesByProjectId,
  } = useProjects();

  const projectId = Array.isArray(id) ? id[0] : id;
  const [apiProject, setApiProject] = useState<any>(null);
  const [apiMilestones, setApiMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch project and milestones from API
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchMilestones();
    }
  }, [projectId]);

  const fetchProject = async () => {
    if (!projectId) return;
    
    try {
      setIsLoading(true);
      console.log("[API] GET /projects/:id", projectId);
      const response = await projectsAPI.getById(projectId);
      
      if (response.success && response.data) {
        setApiProject(response.data);
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      // Fallback to context
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMilestones = async () => {
    if (!projectId) return;
    
    try {
      console.log("[API] GET /milestones/projects/:projectId", projectId);
      const response = await milestonesAPI.getByProject(projectId);
      
      if (response.success && response.data) {
        const mappedMilestones = Array.isArray(response.data) ? response.data.map((m: any) => ({
          id: m.id || m.milestone_id,
          projectId: m.project_id || m.projectId,
          title: m.title || m.name,
          description: m.description,
          dueDate: m.due_date || m.dueDate,
          amount: m.amount || m.budget,
          status: m.status || "pending",
          submittedAt: m.submitted_at || m.submittedAt,
          approvedAt: m.approved_at || m.approvedAt,
        })) : [];
        setApiMilestones(mappedMilestones);
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      // Fallback to context
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProject(), fetchMilestones()]);
    setRefreshing(false);
  };

  // Use API data if available, otherwise fallback to context
  const project = apiProject || getProjectById(projectId as string);
  const milestones = apiMilestones.length > 0 ? apiMilestones : getMilestonesByProjectId(projectId as string);
  const scope = getScopeByProjectId(projectId as string);
  const updates = getProgressUpdatesByProjectId(projectId as string);

  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "updates">("overview");

  // Visible for Admin only
  const isAdmin = user?.role === "ADMIN";

  const handleApproveProject = async () => {
    if (!projectId) return;
    Alert.alert(
      "Approve Project",
      "Are you sure you want to approve this project?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setLoading(true);
            try {
              console.log("[API] Approve project", projectId);
              await adminAPI.approveProject(projectId as string);
              Alert.alert("Success", "Project approved successfully");
              await fetchProject();
              router.back();
            } catch (error: any) {
              console.log("[API ERROR]", error);
              Alert.alert(
                "Error",
                error?.response?.data?.message || error?.message || "Something went wrong"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangeStatus = () => {
    if (!projectId) return;
    Alert.alert(
      "Change Project Status",
      "Select new status:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Active",
          onPress: async () => {
            setLoading(true);
            try {
              console.log("[API] Update project status", projectId, "active");
              await adminAPI.updateProjectStatus(projectId as string, "active");
              Alert.alert("Success", "Project status updated to Active");
              await fetchProject();
            } catch (error: any) {
              console.log("[API ERROR]", error);
              Alert.alert(
                "Error",
                error?.response?.data?.message || error?.message || "Something went wrong"
              );
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: "On Hold",
          onPress: async () => {
            setLoading(true);
            try {
              console.log("[API] Update project status", projectId, "on_hold");
              await adminAPI.updateProjectStatus(projectId as string, "on_hold");
              Alert.alert("Success", "Project status updated to On Hold");
              await fetchProject();
            } catch (error: any) {
              console.log("[API ERROR]", error);
              Alert.alert(
                "Error",
                error?.response?.data?.message || error?.message || "Something went wrong"
              );
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: "Completed",
          onPress: async () => {
            setLoading(true);
            try {
              console.log("[API] Update project status", projectId, "completed");
              await adminAPI.updateProjectStatus(projectId as string, "completed");
              Alert.alert("Success", "Project status updated to Completed");
              await fetchProject();
            } catch (error: any) {
              console.log("[API ERROR]", error);
              Alert.alert(
                "Error",
                error?.response?.data?.message || error?.message || "Something went wrong"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading && !project) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Project Dashboard",
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Project Dashboard",
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Project Not Found</Text>
          <Text style={styles.errorText}>Unable to load project information</Text>
        </View>
      </View>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "approved").length;
  const progressPercentage = milestones.length > 0 
    ? Math.round((completedMilestones / milestones.length) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: project.title,
          headerShown: true,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.statusBar}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{project.status.toUpperCase()}</Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{progressPercentage}%</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.tabActive]}
          onPress={() => setActiveTab("overview")}
        >
          <Text style={[styles.tabText, activeTab === "overview" && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "milestones" && styles.tabActive]}
          onPress={() => setActiveTab("milestones")}
        >
          <Text style={[styles.tabText, activeTab === "milestones" && styles.tabTextActive]}>
            Milestones ({milestones.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "updates" && styles.tabActive]}
          onPress={() => setActiveTab("updates")}
        >
          <Text style={[styles.tabText, activeTab === "updates" && styles.tabTextActive]}>
            Updates ({updates.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "overview" && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <DollarSign size={24} color={Colors.primary} />
                <Text style={styles.statValue}>${project.totalAmount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Budget</Text>
              </View>
              <View style={styles.statCard}>
                <DollarSign size={24} color={Colors.success} />
                <Text style={styles.statValue}>${project.paidAmount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Paid</Text>
              </View>
              <View style={styles.statCard}>
                <DollarSign size={24} color={Colors.warning} />
                <Text style={styles.statValue}>${project.escrowBalance.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Escrow</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Project Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Owner:</Text>
                <Text style={styles.detailValue}>{project.ownerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contractor:</Text>
                <Text style={styles.detailValue}>{project.contractorName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(project.startDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(project.endDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{project.description}</Text>
            </View>

            {scope && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Scope of Work</Text>
                <Text style={styles.scopeText}>
                  {scope.workBreakdown.phases.length} phases • {scope.materials.items.length} materials
                </Text>
              </View>
            )}

            {/* Admin-only actions */}
            {isAdmin && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Admin Actions</Text>
                <View style={styles.adminActions}>
                  <TouchableOpacity
                    style={[styles.adminButton, styles.approveButton]}
                    onPress={handleApproveProject}
                    disabled={loading}
                  >
                    <CheckCircle size={20} color={Colors.white} />
                    <Text style={styles.adminButtonText}>Approve Project</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.adminButton, styles.statusButton]}
                    onPress={handleChangeStatus}
                    disabled={loading}
                  >
                    <AlertCircle size={20} color={Colors.white} />
                    <Text style={styles.adminButtonText}>Change Status</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === "milestones" && (
          <View style={styles.milestonesContainer}>
            {milestones.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyStateText}>No milestones yet</Text>
              </View>
            ) : (
              milestones.map((milestone, index) => (
                <View key={milestone.id} style={styles.milestoneCard}>
                  <View style={styles.milestoneHeader}>
                    <View style={styles.milestoneNumber}>
                      <Text style={styles.milestoneNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.milestoneStatus,
                        {
                          backgroundColor:
                            milestone.status === "approved"
                              ? Colors.success
                              : milestone.status === "pending_review"
                              ? Colors.warning
                              : Colors.border,
                        },
                      ]}
                    >
                      {milestone.status === "approved" && (
                        <CheckCircle size={16} color={Colors.white} />
                      )}
                      {milestone.status === "pending_review" && (
                        <Clock size={16} color={Colors.white} />
                      )}
                    </View>
                  </View>
                  <View style={styles.milestoneFooter}>
                    <View style={styles.milestoneAmount}>
                      <DollarSign size={14} color={Colors.primary} />
                      <Text style={styles.milestoneAmountText}>
                        ${milestone.paymentAmount.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.milestoneDueDate}>
                      Due {new Date(milestone.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "updates" && (
          <View style={styles.updatesContainer}>
            {updates.length === 0 ? (
              <View style={styles.emptyState}>
                <TrendingUp size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyStateText}>No updates yet</Text>
              </View>
            ) : (
              updates.map((update) => (
                <View key={update.id} style={styles.updateCard}>
                  <View style={styles.updateHeader}>
                    <Text style={styles.updateTitle}>{update.updateType} Update</Text>
                    <Text style={styles.updateDate}>
                      {new Date(update.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.updateDescription}>
                    Work Completed: {update.workCompleted}
                  </Text>
                  {update.workPlanned && (
                    <Text style={styles.updateDescription}>
                      Work Planned: {update.workPlanned}
                    </Text>
                  )}
                  {update.issues && (
                    <Text style={[styles.updateDescription, { color: Colors.error }]}>
                      Issues: {update.issues}
                    </Text>
                  )}
                  {update.photos && update.photos.length > 0 && (
                    <Text style={styles.updatePhotos}>
                      {update.photos.length} photo{update.photos.length > 1 ? "s" : ""} attached
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusInfo: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  progressInfo: {
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.success,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  scopeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  milestonesContainer: {
    gap: 12,
  },
  milestoneCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  milestoneHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  milestoneNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneNumberText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  milestoneStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  milestoneAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  milestoneAmountText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  milestoneDueDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  updatesContainer: {
    gap: 12,
  },
  updateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  updateTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginRight: 12,
  },
  updateDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  updateDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  updatePhotos: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  adminActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  adminButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  statusButton: {
    backgroundColor: Colors.primary,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
