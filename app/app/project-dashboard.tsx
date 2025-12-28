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
  ArrowRight,
  Shield,
} from "lucide-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useProjects } from "@/contexts/ProjectsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDisputes } from "@/contexts/DisputesContext";
import { adminAPI, projectsAPI, milestonesAPI, progressUpdatesAPI } from "@/services/api";

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
  primaryLight: "#EFF6FF",
};

export default function ProjectDashboardScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, colors } = useAuth();
  const {
    getProjectById,
    getScopeByProjectId,
    getContractByProjectId,
    getMilestonesByProjectId,
    getProgressUpdatesByProjectId,
  } = useProjects();
  const { getDisputesForProject } = useDisputes();

  const projectId = Array.isArray(id) ? id[0] : id;
  const [apiProject, setApiProject] = useState<any>(null);
  const [apiMilestones, setApiMilestones] = useState<any[]>([]);
  const [apiUpdates, setApiUpdates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch project and milestones from API
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchMilestones();
      fetchUpdates();
    }
  }, [projectId]);

  const fetchProject = async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      console.log("[API] GET /projects/:id", projectId);
      const response = await projectsAPI.getById(projectId);

      if (response.success && response.data) {
        const raw = response.data;
        const mapped = {
          ...raw,
          id: raw.id,
          title: raw.title,
          description: raw.description,
          status: raw.status || "setup",
          totalAmount: raw.total_amount || raw.budget || 0,
          paidAmount: raw.paid_amount || 0,
          escrowBalance: raw.escrow_balance || 0,
          ownerId: raw.owner_id,
          ownerName: raw.owner?.full_name || (raw.owner ? `${raw.owner.first_name || ''} ${raw.owner.last_name || ''}`.trim() : "Unknown"),
          contractorId: raw.contractor_id,
          contractorName: raw.contractor?.full_name || (raw.contractor ? `${raw.contractor.first_name || ''} ${raw.contractor.last_name || ''}`.trim() : "Not assigned"),
          startDate: raw.start_date,
          endDate: raw.end_date,
          completionPercentage: raw.completion_percentage || 0,
        };
        setApiProject(mapped);
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
          amount: m.amount || m.payment_amount || m.budget || 0,
          paymentAmount: m.payment_amount || m.amount || m.budget || 0,
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

  const fetchUpdates = async () => {
    if (!projectId) return;
    try {
      console.log("[API] GET /projects/:projectId/progress", projectId);
      const response = await progressUpdatesAPI.getByProject(projectId);
      if (response.success && response.data) {
        setApiUpdates(response.data);
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProject(), fetchMilestones(), fetchUpdates()]);
    setRefreshing(false);
  };

  // Use API data if available, otherwise fallback to context
  const project = apiProject || getProjectById(projectId as string);
  const milestones = apiMilestones.length > 0 ? apiMilestones : getMilestonesByProjectId(projectId as string);
  const scope = getScopeByProjectId(projectId as string);
  const updates = apiUpdates.length > 0 ? apiUpdates : getProgressUpdatesByProjectId(projectId as string);

  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "updates" | "contract" | "disputes">("overview");

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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading project...</Text>
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Project Dashboard",
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Project Not Found</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Unable to load project information</Text>
        </View>
      </View>
    );
  }

  const completedMilestones = milestones.filter(m => m.status === "approved").length;
  const progressPercentage = milestones.length > 0
    ? Math.round((completedMilestones / milestones.length) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: project.title,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.statusBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Status</Text>
          <Text style={[styles.statusValue, { color: colors.primary }]}>{project.status.toUpperCase()}</Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
          <Text style={[styles.progressValue, { color: colors.success }]}>{progressPercentage}%</Text>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[
          { id: "overview", label: "Overview" },
          { id: "milestones", label: `Milestones (${milestones.length})` },
          { id: "updates", label: "Work Log" },
          { id: "contract", label: "Contract" },
          { id: "disputes", label: `Disputes (${getDisputesForProject(project.id).length})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && [styles.tabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary, fontSize: 11 }, activeTab === tab.id && [styles.tabTextActive, { color: colors.primary }]]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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
            {/* Status-based Call to Action */}
            {project.status === 'setup' && (
              <TouchableOpacity
                style={[styles.ctaCard, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: "/contract-review", params: { projectId: project.id } } as any)}
              >
                <View style={styles.ctaContent}>
                  <FileText size={24} color="#fff" />
                  <View style={styles.ctaTextContainer}>
                    <Text style={styles.ctaTitle}>Action Required: Sign Contract</Text>
                    <Text style={styles.ctaSubtitle}>Review the AI-generated contract and sign to begin.</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#fff" />
              </TouchableOpacity>
            )}

            {project.status === 'active' && progressPercentage === 100 && (
              <TouchableOpacity
                style={[styles.ctaCard, { backgroundColor: colors.success }]}
                onPress={() => router.push({ pathname: "/project-closeout", params: { projectId: project.id } } as any)}
              >
                <View style={styles.ctaContent}>
                  <CheckCircle size={24} color="#fff" />
                  <View style={styles.ctaTextContainer}>
                    <Text style={styles.ctaTitle}>Project Complete! Ready for Closeout</Text>
                    <Text style={styles.ctaSubtitle}>Finalize the punch list and release the final payment.</Text>
                  </View>
                </View>
                <ArrowRight size={20} color="#fff" />
              </TouchableOpacity>
            )}

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <DollarSign size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>${(project.totalAmount || 0).toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Budget</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <DollarSign size={24} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>${(project.paidAmount || 0).toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paid</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <DollarSign size={24} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>${(project.escrowBalance || 0).toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Escrow</Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Details</Text>
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Owner:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{project.ownerName}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contractor:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{project.contractorName}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Start Date:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>End Date:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{project.description}</Text>
            </View>

            {scope && (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Scope of Work</Text>
                <Text style={[styles.scopeText, { color: colors.textSecondary }]}>
                  {scope.workBreakdown?.phases?.length || 0} phases • {scope.materials?.items?.length || 0} materials
                </Text>
              </View>
            )}

            {/* Admin-only actions */}
            {isAdmin && (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin Actions</Text>
                <View style={styles.adminActions}>
                  <TouchableOpacity
                    style={[styles.adminButton, styles.approveButton, { backgroundColor: colors.success }]}
                    onPress={handleApproveProject}
                    disabled={loading}
                  >
                    <CheckCircle size={20} color={colors.white} />
                    <Text style={styles.adminButtonText}>Approve Project</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.adminButton, styles.statusButton, { backgroundColor: colors.primary }]}
                    onPress={handleChangeStatus}
                    disabled={loading}
                  >
                    <AlertCircle size={20} color={colors.white} />
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
                <FileText size={48} color={staticColors.textTertiary} />
                <Text style={styles.emptyStateText}>No milestones yet</Text>
              </View>
            ) : (
              milestones.map((milestone, index) => (
                <TouchableOpacity
                  key={milestone.id}
                  style={[styles.milestoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/milestone-details", params: { id: milestone.id } } as any)}
                >
                  <View style={styles.milestoneHeader}>
                    <View style={[styles.milestoneNumber, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.milestoneNumberText, { color: colors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={[styles.milestoneTitle, { color: colors.text }]}>{milestone.title}</Text>
                      <Text style={[styles.milestoneDescription, { color: colors.textSecondary }]}>{milestone.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.milestoneStatus,
                        {
                          backgroundColor:
                            milestone.status === "approved"
                              ? colors.success
                              : milestone.status === "pending_review" || milestone.status === "submitted"
                                ? colors.warning
                                : milestone.status === "rejected"
                                  ? colors.error
                                  : colors.border,
                        },
                      ]}
                    >
                      {milestone.status === "approved" && (
                        <CheckCircle size={16} color={colors.white} />
                      )}
                      {(milestone.status === "pending_review" || milestone.status === "submitted") && (
                        <Clock size={16} color={colors.white} />
                      )}
                      {milestone.status === "rejected" && (
                        <XCircle size={16} color={colors.white} />
                      )}
                    </View>
                  </View>
                  <View style={[styles.milestoneFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.milestoneAmount}>
                      <DollarSign size={14} color={colors.primary} />
                      <Text style={[styles.milestoneAmountText, { color: colors.primary }]}>
                        ${(milestone.paymentAmount || milestone.amount || 0).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={[styles.milestoneDueDate, { color: colors.textSecondary }]}>
                      Due {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'TBD'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === "updates" && (
          <View style={styles.updatesContainer}>
            {/* Contractor-only Quick Action */}
            {(user?.role?.toUpperCase() === 'CONTRACTOR' || user?.id === project?.contractorId) && (
              <TouchableOpacity
                style={[styles.addUpdateButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push({ pathname: "/add-progress-update", params: { projectId: project.id } } as any)}
              >
                <TrendingUp size={20} color={colors.white} />
                <Text style={styles.addUpdateButtonText}>Post Daily Update</Text>
              </TouchableOpacity>
            )}

            {updates.length === 0 ? (
              <View style={styles.emptyState}>
                <TrendingUp size={48} color={staticColors.textTertiary} />
                <Text style={styles.emptyStateText}>No updates yet</Text>
              </View>
            ) : (
              updates.map((update) => (
                <View key={update.id} style={[styles.updateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.updateHeader}>
                    <Text style={[styles.updateTitle, { color: colors.text }]}>{update.updateType} Update</Text>
                    <Text style={[styles.updateDate, { color: colors.textSecondary }]}>
                      {update.createdAt ? new Date(update.createdAt).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                  <Text style={[styles.updateDescription, { color: colors.textSecondary }]}>
                    Work Completed: {update.workCompleted}
                  </Text>
                  {update.workPlanned && (
                    <Text style={[styles.updateDescription, { color: colors.textSecondary }]}>
                      Work Planned: {update.workPlanned}
                    </Text>
                  )}
                  {update.issues && (
                    <Text style={[styles.updateDescription, { color: colors.error }]}>
                      Issues: {update.issues}
                    </Text>
                  )}
                  {update.photos && update.photos.length > 0 && (
                    <Text style={[styles.updatePhotos, { color: colors.primary }]}>
                      {update.photos.length} photo{update.photos.length > 1 ? "s" : ""} attached
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        {activeTab === "contract" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Executed Contract</Text>
            </View>
            <Text style={[styles.description, { color: colors.textSecondary, marginBottom: 15 }]}>
              The legal agreement between {project.ownerName} and {project.contractorName}.
            </Text>
            <TouchableOpacity
              style={[styles.adminButton, { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary + '30' }]}
              onPress={() => router.push({ pathname: "/contract-review", params: { projectId: project.id } } as any)}
            >
              <FileText size={18} color={colors.primary} />
              <Text style={[styles.adminButtonText, { color: colors.primary }]}>View Full Contract Details</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "disputes" && (
          <View style={styles.disputesSection}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={20} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Disputes</Text>
            </View>
            <TouchableOpacity
              style={[styles.addDisputeButton, { backgroundColor: colors.error + '10' }]}
              onPress={() => router.push({ pathname: "/disputes", params: { projectId: project.id } } as any)}
            >
              <AlertCircle size={18} color={colors.error} />
              <Text style={[styles.addDisputeButtonText, { color: colors.error }]}>File New Dispute</Text>
            </TouchableOpacity>

            {getDisputesForProject(project.id).length === 0 ? (
              <Text style={[styles.emptyStateText, { textAlign: 'center', marginTop: 20 }]}>No active disputes for this project.</Text>
            ) : (
              getDisputesForProject(project.id).map(dispute => (
                <TouchableOpacity
                  key={dispute.id}
                  style={[styles.disputeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/dispute-details", params: { id: dispute.id } } as any)}
                >
                  <View style={styles.disputeHeader}>
                    <Text style={[styles.disputeType, { color: colors.text }]}>
                      {dispute.disputeType.toUpperCase()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                        {dispute.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.disputeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {dispute.description}
                  </Text>
                  <View style={styles.disputeFooter}>
                    <Text style={[styles.disputeDate, { color: colors.textTertiary }]}>
                      Filed: {new Date(dispute.createdAt).toLocaleDateString()}
                    </Text>
                    {dispute.amountDisputed && (
                      <Text style={[styles.disputeAmount, { color: colors.error }]}>
                        ${dispute.amountDisputed.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
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
    backgroundColor: staticColors.background,
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
    backgroundColor: staticColors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  statusInfo: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  progressInfo: {
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.success,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: staticColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  tabTextActive: {
    color: staticColors.primary,
    fontWeight: "700" as const,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: staticColors.border,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  statLabel: {
    fontSize: 11,
    color: staticColors.textSecondary,
    textAlign: "center",
  },
  section: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: staticColors.textSecondary,
  },
  scopeText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  milestonesContainer: {
    gap: 12,
  },
  milestoneCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: staticColors.border,
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
    backgroundColor: staticColors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneNumberText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 13,
    color: staticColors.textSecondary,
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
    borderTopColor: staticColors.border,
  },
  milestoneAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  milestoneAmountText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  milestoneDueDate: {
    fontSize: 12,
    color: staticColors.textSecondary,
  },
  updatesContainer: {
    gap: 12,
  },
  updateCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: staticColors.border,
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
    color: staticColors.text,
    marginRight: 12,
  },
  updateDate: {
    fontSize: 12,
    color: staticColors.textSecondary,
  },
  updateDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: staticColors.textSecondary,
    marginBottom: 8,
  },
  updatePhotos: {
    fontSize: 12,
    color: staticColors.primary,
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
    color: staticColors.textSecondary,
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
    color: staticColors.text,
  },
  errorText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: "center",
  },
  adminActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    gap: 8,
  },
  approveButton: {
    backgroundColor: staticColors.success,
  },
  statusButton: {
    backgroundColor: staticColors.primary,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
  addUpdateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  addUpdateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
    color: staticColors.textSecondary,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  disputesSection: {
    gap: 12,
  },
  addDisputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  addDisputeButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  disputeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disputeType: {
    fontWeight: '700',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  disputeDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  disputeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  disputeDate: {
    fontSize: 12,
  },
  disputeAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
