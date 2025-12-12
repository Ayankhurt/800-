import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  FolderKanban,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI, projectsAPI, milestonesAPI } from "@/services/api";

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
    phone?: string;
  };
  contractor?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export default function ProjectDetailsScreen() {
  const router = useRouter();
  const { id, projectData } = useLocalSearchParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const projectId = Array.isArray(id) ? id[0] : id;
  const projectDataParam = Array.isArray(projectData) ? projectData[0] : projectData;

  // Role security
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  // Initialize project from passed data or fetch
  useEffect(() => {
    if (user?.role === "ADMIN" && projectId) {
      if (projectDataParam) {
        try {
          const parsedProject = JSON.parse(decodeURIComponent(projectDataParam));
          if (parsedProject && parsedProject.id === projectId) {
            setProject(parsedProject);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse project data from params:", e);
        }
      }
      fetchProjectDetails();
    }
  }, [projectId, user, projectDataParam]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      console.log("[API] GET /projects/:id", projectId);
      const response = await projectsAPI.getById(projectId);
      
      if (response.success && response.data) {
        setProject(response.data);
      } else {
        // Fallback to getAllProjects if getById doesn't exist
        const allResponse = await adminAPI.getAllProjects();
        const projects = allResponse?.data || allResponse || [];
        const projectArray = Array.isArray(projects) ? projects : [];
        const foundProject = projectArray.find((p: Project) => p.id === projectId);
        
        if (foundProject) {
          setProject(foundProject);
        } else if (projectDataParam) {
          try {
            const parsedProject = JSON.parse(decodeURIComponent(projectDataParam));
            if (parsedProject && parsedProject.id === projectId) {
              setProject(parsedProject);
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
      if (projectDataParam) {
        try {
          const parsedProject = JSON.parse(decodeURIComponent(projectDataParam));
          if (parsedProject && parsedProject.id === projectId) {
            setProject(parsedProject);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "decline" | "status", status?: string) => {
    if (!projectId) {
      Alert.alert("Error", "Project ID is missing");
      return;
    }

    const actionName = action === "approve" ? "Approve" : action === "decline" ? "Decline" : "Change Status";
    const confirmMessage = action === "approve" 
      ? "Are you sure you want to approve this project?"
      : action === "decline"
      ? "Are you sure you want to decline this project?"
      : `Change project status to ${status}?`;

    Alert.alert(`Confirm ${actionName}`, confirmMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: actionName,
        onPress: async () => {
          try {
            setActionLoading(true);
            let response;

            if (action === "approve") {
              console.log("[API] Approve project", projectId);
              response = await adminAPI.approveProject?.(projectId);
            } else if (action === "decline") {
              console.log("[API] PUT /projects/:id (decline)", projectId);
              response = await adminAPI.updateProjectStatus?.(projectId, "declined");
            } else if (action === "status" && status) {
              console.log("[API] PUT /projects/:id (status)", projectId, status);
              response = await adminAPI.updateProjectStatus?.(projectId, status);
            }

            Alert.alert("Success", `${actionName} completed successfully`, [
              {
                text: "OK",
                onPress: async () => {
                  await fetchProjectDetails();
                },
              },
            ]);
          } catch (error: any) {
            console.log("[API ERROR]", error);
            Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const getStatusInfo = () => {
    const status = project?.status?.toLowerCase();
    if (status === "pending" || status === "draft") {
      return { label: "Pending", color: Colors.warning, icon: Clock };
    }
    if (status === "approved") {
      return { label: "Approved", color: Colors.success, icon: CheckCircle };
    }
    if (status === "in-progress" || status === "active") {
      return { label: "In Progress", color: Colors.info, icon: RefreshCw };
    }
    if (status === "completed" || status === "done") {
      return { label: "Completed", color: Colors.success, icon: CheckCircle };
    }
    if (status === "declined" || status === "rejected") {
      return { label: "Declined", color: Colors.error, icon: XCircle };
    }
    return { label: "Unknown", color: Colors.textSecondary, icon: AlertCircle };
  };

  // Block non-admin access
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: "Project Details" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading project details...</Text>
        </View>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: "Project Details" }} />
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Project not found</Text>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isPending = project.status?.toLowerCase() === "pending" || project.status?.toLowerCase() === "draft";
  const isApproved = project.status?.toLowerCase() === "approved";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Project Details",
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Project Header */}
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <FolderKanban size={24} color={Colors.primary} />
            <Text style={styles.projectTitle}>{project.title || "Untitled Project"}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color + "15", borderColor: statusInfo.color },
            ]}
          >
            <StatusIcon size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {/* Description */}
        {project.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{project.description}</Text>
          </View>
        )}

        {/* Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>
          {project.budget && (
            <View style={styles.infoRow}>
              <DollarSign size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>${project.budget.toLocaleString()}</Text>
              </View>
            </View>
          )}
          {project.created_at && (
            <View style={styles.infoRow}>
              <Calendar size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(project.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Owner Info */}
        {project.owner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Owner</Text>
            <View style={styles.infoRow}>
              <User size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {project.owner.full_name || "Unknown"}
                </Text>
              </View>
            </View>
            {project.owner.email && (
              <View style={styles.infoRow}>
                <Mail size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{project.owner.email}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Contractor Info */}
        {project.contractor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contractor</Text>
            <View style={styles.infoRow}>
              <User size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {project.contractor.full_name || "Unknown"}
                </Text>
              </View>
            </View>
            {project.contractor.email && (
              <View style={styles.infoRow}>
                <Mail size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{project.contractor.email}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Admin Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>

          {isPending && (
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleAction("approve")}
              disabled={actionLoading}
            >
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.actionButtonText}>Approve Project</Text>
            </TouchableOpacity>
          )}

          {isPending && (
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => handleAction("decline")}
              disabled={actionLoading}
            >
              <XCircle size={20} color={Colors.error} />
              <Text style={styles.actionButtonText}>Decline Project</Text>
            </TouchableOpacity>
          )}

          {isApproved && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.info + "15", borderColor: Colors.info }]}
              onPress={() => handleAction("status", "in-progress")}
              disabled={actionLoading}
            >
              <RefreshCw size={20} color={Colors.info} />
              <Text style={[styles.actionButtonText, { color: Colors.info }]}>Mark In Progress</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.info + "15", borderColor: Colors.info }]}
            onPress={() => handleAction("status", "completed")}
            disabled={actionLoading}
          >
            <CheckCircle size={20} color={Colors.info} />
            <Text style={[styles.actionButtonText, { color: Colors.info }]}>Mark Completed</Text>
          </TouchableOpacity>
        </View>

        {actionLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
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
  headerSection: {
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
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
  descriptionText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
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
  approveButton: {
    backgroundColor: Colors.success + "15",
    borderColor: Colors.success,
  },
  declineButton: {
    backgroundColor: Colors.error + "15",
    borderColor: Colors.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  loadingOverlay: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
});

