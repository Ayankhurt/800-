import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI, disputesAPI } from "@/services/api";

interface Dispute {
  id: string;
  project_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_at?: string;
  resolution_note?: string;
}

export default function DisputeDetailsScreen() {
  const router = useRouter();
  const { id, disputeData } = useLocalSearchParams();
  const { user, colors } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [staffId, setStaffId] = useState("");

  const disputeId = Array.isArray(id) ? id[0] : id;
  const disputeDataParam = Array.isArray(disputeData) ? disputeData[0] : disputeData;

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "ADMIN" && disputeId) {
      if (disputeDataParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(disputeDataParam));
          if (parsed && parsed.id === disputeId) {
            setDispute(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse dispute data:", e);
        }
      }
      fetchDisputeDetails();
    }
  }, [disputeId, user, disputeDataParam]);

  const fetchDisputeDetails = async () => {
    if (!disputeId) return;
    try {
      setLoading(true);
      console.log("[API] GET /disputes/:id", disputeId);
      const response = await disputesAPI.getById(disputeId);

      if (response.success && response.data) {
        setDispute(response.data);
      } else {
        // Fallback to adminAPI
        const adminResponse = await adminAPI.getDisputeById(disputeId);
        const disputeData = adminResponse?.data || adminResponse;
        if (disputeData && disputeData.id) {
          setDispute(disputeData);
        }
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
      if (disputeDataParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(disputeDataParam));
          if (parsed && parsed.id === disputeId) {
            setDispute(parsed);
          }
        } catch (e) {
          // Ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!disputeId) return;
    if (!resolutionNote.trim()) {
      Alert.alert("Error", "Please provide a resolution note");
      return;
    }

    try {
      setActionLoading(true);
      setShowResolutionModal(false);
      console.log("[API] PUT /disputes/:id/status", disputeId, { status: "resolved", resolution: resolutionNote.trim() });
      const response = await disputesAPI.updateStatus(disputeId, {
        status: "resolved",
        resolution: resolutionNote.trim(),
      });

      if (response.success) {
        Alert.alert("Success", "Dispute resolved successfully", [
          {
            text: "OK",
            onPress: async () => {
              await fetchDisputeDetails();
              setResolutionNote("");
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to resolve dispute");
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = () => {
    if (!disputeId) return;
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async () => {
    if (!disputeId) return;
    if (!staffId || !staffId.trim()) {
      Alert.alert("Error", "Please provide a staff user ID");
      return;
    }

    try {
      setActionLoading(true);
      setShowReassignModal(false);
      console.log("[API] PUT /disputes/:id/assign", disputeId, { assignedTo: staffId.trim() });
      const response = await disputesAPI.assign(disputeId, { assignedTo: staffId.trim() });

      if (response.success) {
        Alert.alert("Success", "Dispute reassigned successfully", [
          {
            text: "OK",
            onPress: async () => {
              await fetchDisputeDetails();
              setStaffId("");
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to reassign dispute");
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  if (user && user.role !== "ADMIN") {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Unauthorized" }} />
        <View style={styles.unauthorizedContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={styles.unauthorizedText}>Access Denied</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: "Dispute Details" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dispute details...</Text>
        </View>
      </View>
    );
  }

  if (!dispute) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: "Dispute Details" }} />
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Dispute not found</Text>
        </View>
      </View>
    );
  }

  const isResolved = dispute.status?.toLowerCase() === "resolved" || dispute.status?.toLowerCase() === "closed";
  const isOpen = dispute.status?.toLowerCase() === "open" || dispute.status?.toLowerCase() === "pending";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Dispute Details" }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <AlertTriangle size={24} color={colors.warning} />
            <Text style={styles.disputeTitle}>{dispute.title || "Untitled Dispute"}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isResolved ? colors.success + "15" : colors.warning + "15",
                borderColor: isResolved ? colors.success : colors.warning,
              },
            ]}
          >
            {isResolved ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <Clock size={16} color={colors.warning} />
            )}
            <Text
              style={[
                styles.statusText,
                { color: isResolved ? colors.success : colors.warning },
              ]}
            >
              {isResolved ? "Resolved" : "Open"}
            </Text>
          </View>
        </View>

        {dispute.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{dispute.description}</Text>
          </View>
        )}

        {dispute.resolution_note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Note</Text>
            <Text style={styles.descriptionText}>{dispute.resolution_note}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispute Information</Text>
          {dispute.created_at && (
            <View style={styles.infoRow}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(dispute.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
          {dispute.assigned_to && (
            <View style={styles.infoRow}>
              <User size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Assigned To</Text>
                <Text style={styles.infoValue}>Staff Member</Text>
              </View>
            </View>
          )}
        </View>

        {!isResolved && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>

            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => setShowResolutionModal(true)}
              disabled={actionLoading}
            >
              <CheckCircle size={20} color={colors.success} />
              <Text style={styles.actionButtonText}>Resolve Dispute</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.info + "15", borderColor: colors.info }]}
              onPress={handleReassign}
              disabled={actionLoading}
            >
              <User size={20} color={colors.info} />
              <Text style={[styles.actionButtonText, { color: colors.info }]}>Reassign to Staff</Text>
            </TouchableOpacity>
          </View>
        )}

        {actionLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Resolution Modal */}
      <Modal
        visible={showResolutionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowResolutionModal(false);
          setResolutionNote("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Resolve Dispute</Text>
            <Text style={styles.modalSubtitle}>Please provide a resolution note:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter resolution note..."
              placeholderTextColor={colors.textSecondary}
              value={resolutionNote}
              onChangeText={setResolutionNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowResolutionModal(false);
                  setResolutionNote("");
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleResolve}
                disabled={actionLoading || !resolutionNote.trim()}
              >
                <Text style={styles.modalButtonTextConfirm}>Resolve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        visible={showReassignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowReassignModal(false);
          setStaffId("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reassign Dispute</Text>
            <Text style={styles.modalSubtitle}>Enter staff user ID to reassign this dispute:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter staff user ID..."
              placeholderTextColor={colors.textSecondary}
              value={staffId}
              onChangeText={setStaffId}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowReassignModal(false);
                  setStaffId("");
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleReassignSubmit}
                disabled={actionLoading || !staffId.trim()}
              >
                <Text style={styles.modalButtonTextConfirm}>Reassign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    marginTop: 16,
  },
  headerSection: {
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  disputeTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
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
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text,
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
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
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
  resolveButton: {
    backgroundColor: colors.success + "15",
    borderColor: colors.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  loadingOverlay: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.white,
  },
});
