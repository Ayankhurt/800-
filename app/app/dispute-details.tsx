import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ArrowUpCircle,
  Image as ImageIcon,
} from "lucide-react-native";
import { useDisputes } from "@/contexts/DisputesContext";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

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

export default function DisputeDetailsPage() {
  const { id } = useLocalSearchParams();
  const { user, colors } = useAuth();
  const { disputes, updateDisputeStatus, escalateDispute, addEvidence } = useDisputes();
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);

  // Visible for Admin only
  const isAdmin = user?.role === "ADMIN";

  const dispute = disputes.find((d) => d.id === id);

  if (!dispute) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Dispute Not Found" }} />
        <View style={styles.notFound}>
          <AlertCircle size={48} color={colors.textTertiary} />
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Dispute not found</Text>
        </View>
      </View>
    );
  }

  const getStatusIcon = () => {
    switch (dispute.status) {
      case "filed":
        return <AlertCircle size={24} color={colors.warning} />;
      case "under_review":
        return <Clock size={24} color={colors.info} />;
      case "in_mediation":
        return <FileText size={24} color="#8b5cf6" />;
      case "resolved":
        return <CheckCircle size={24} color={colors.success} />;
      case "closed":
        return <XCircle size={24} color={colors.textSecondary} />;
    }
  };

  const getStatusColor = () => {
    switch (dispute.status) {
      case "filed":
        return colors.warning;
      case "under_review":
        return colors.info;
      case "in_mediation":
        return "#8b5cf6";
      case "resolved":
        return colors.success;
      case "closed":
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const handleEscalate = () => {
    const stages = {
      internal: "platform",
      platform: "professional",
      professional: "legal",
    } as const;

    const nextStage = stages[dispute.resolutionStage as keyof typeof stages];
    if (nextStage) {
      escalateDispute(dispute.id, nextStage);
      Alert.alert("Success", `Dispute escalated to ${nextStage} mediation`);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      Alert.alert("Error", "Please provide a resolution description");
      return;
    }

    if (isAdmin) {
      // Use admin API for resolving
      setLoading(true);
      try {
        await adminAPI.resolveDispute(dispute.id, { resolution });
        Alert.alert("Success", "Dispute resolved successfully");
        router.back();
      } catch (error: any) {
        Alert.alert(
          "Error",
          error.response?.data?.message || error.message || "Failed to resolve dispute"
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Regular user resolve
      updateDisputeStatus(dispute.id, "resolved", resolution);
      Alert.alert("Success", "Dispute marked as resolved");
      router.back();
    }
  };

  const handleAddEvidence = () => {
    Alert.alert(
      "Add Evidence",
      "What type of evidence would you like to add?",
      [
        {
          text: "Photo",
          onPress: () => {
            // In a real app, open image picker
            addEvidence(dispute.id, { photos: ["added-photo-" + Date.now() + ".jpg"] });
            Alert.alert("Success", "Photo evidence added");
          }
        },
        {
          text: "Document",
          onPress: () => {
            addEvidence(dispute.id, { documents: ["added-doc-" + Date.now() + ".pdf"] });
            Alert.alert("Success", "Document evidence added");
          }
        },
        {
          text: "Message",
          onPress: () => {
            Alert.prompt("Add Message", "Enter the message to add as evidence", (msg) => {
              if (msg) {
                addEvidence(dispute.id, { messages: [msg] });
                Alert.alert("Success", "Message evidence added");
              }
            });
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleReassignDispute = () => {
    Alert.prompt(
      "Reassign Dispute",
      "Enter user ID to reassign this dispute to:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reassign",
          onPress: async (userId: string | undefined) => {
            if (!userId) {
              Alert.alert("Error", "Please enter a user ID");
              return;
            }
            setLoading(true);
            try {
              await adminAPI.reassignDispute(dispute.id, { assignedTo: userId });
              Alert.alert("Success", "Dispute reassigned successfully");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || error.message || "Failed to reassign dispute"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleClose = () => {
    Alert.alert(
      "Close Dispute",
      "Are you sure you want to close this dispute?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: () => {
            updateDisputeStatus(dispute.id, "closed");
            router.back();
          },
        },
      ]
    );
  };

  const isResolved = dispute.status === "resolved" || dispute.status === "closed";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Dispute Details",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            {getStatusIcon()}
            <View style={styles.headerText}>
              <Text style={[styles.disputeType, { color: colors.text }]}>
                {dispute.disputeType.replace("_", " ").toUpperCase()}
              </Text>
              <Text style={[styles.disputeId, { color: colors.textSecondary }]}>Case #{dispute.id}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {dispute.status.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <View style={[styles.infoRow, { borderBottomColor: colors.border + "40" }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Filed By:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{dispute.filedByName}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border + "40" }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Filed On:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border + "40" }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Resolution Stage:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {dispute.resolutionStage.charAt(0).toUpperCase() + dispute.resolutionStage.slice(1)}
            </Text>
          </View>
          {dispute.amountDisputed && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border + "40" }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Amount in Dispute:</Text>
              <Text style={[styles.infoValue, styles.amountText, { color: colors.error }]}>
                ${(dispute.amountDisputed || 0).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{dispute.description}</Text>
        </View>

        {dispute.desiredResolution && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Desired Resolution</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{dispute.desiredResolution}</Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Evidence</Text>
            {!isResolved && (
              <TouchableOpacity onPress={handleAddEvidence}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Add Evidence</Text>
              </TouchableOpacity>
            )}
          </View>

          {dispute.evidence.photos.length > 0 && (
            <View style={styles.evidenceItem}>
              <ImageIcon size={20} color={colors.textSecondary} />
              <Text style={[styles.evidenceText, { color: colors.textSecondary }]}>
                {dispute.evidence.photos.length} photo(s)
              </Text>
            </View>
          )}

          {dispute.evidence.documents.length > 0 && (
            <View style={styles.evidenceItem}>
              <FileText size={20} color={colors.textSecondary} />
              <Text style={[styles.evidenceText, { color: colors.textSecondary }]}>
                {dispute.evidence.documents.length} document(s)
              </Text>
            </View>
          )}

          {dispute.evidence.messages.length > 0 && (
            <View style={styles.evidenceItem}>
              <MessageSquare size={20} color={colors.textSecondary} />
              <Text style={[styles.evidenceText, { color: colors.textSecondary }]}>
                {dispute.evidence.messages.length} message(s)
              </Text>
            </View>
          )}

          {dispute.evidence.photos.length === 0 &&
            dispute.evidence.documents.length === 0 &&
            dispute.evidence.messages.length === 0 && (
              <Text style={[styles.noEvidence, { color: colors.textTertiary }]}>No evidence provided</Text>
            )}
        </View>

        {dispute.resolution && (
          <View style={[styles.section, styles.resolutionSection, { backgroundColor: colors.primaryLight, borderColor: colors.success + "60" }]}>
            <Text style={[styles.sectionTitle, styles.resolutionTitle, { color: colors.success }]}>Resolution</Text>
            <Text style={[styles.description, { color: colors.text }]}>{dispute.resolution}</Text>
            {dispute.resolvedAt && (
              <Text style={[styles.resolvedDate, { color: colors.success }]}>
                Resolved on {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString() : 'N/A'}
              </Text>
            )}
          </View>
        )}

        {!isResolved && (
          <>
            <View style={[styles.section, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Resolution</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Describe the resolution or outcome..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                value={resolution}
                onChangeText={setResolution}
              />
            </View>

            <View style={styles.actionsContainer}>
              {dispute.resolutionStage !== "legal" && (
                <TouchableOpacity
                  style={[styles.escalateButton, { backgroundColor: colors.surface, borderColor: colors.warning }]}
                  onPress={handleEscalate}
                >
                  <ArrowUpCircle size={20} color={colors.warning} />
                  <Text style={[styles.escalateButtonText, { color: colors.warning }]}>Escalate</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.resolveButton, { backgroundColor: colors.success }]}
                onPress={handleResolve}
                disabled={loading}
              >
                <CheckCircle size={20} color={colors.white} />
                <Text style={[styles.resolveButtonText, { color: colors.white }]}>
                  {isAdmin ? "Resolve Dispute" : "Mark Resolved"}
                </Text>
              </TouchableOpacity>

              {/* Admin-only: Reassign Dispute */}
              {isAdmin && (
                <TouchableOpacity
                  style={[styles.reassignButton, { backgroundColor: colors.info }]}
                  onPress={handleReassignDispute}
                  disabled={loading}
                >
                  <ArrowUpCircle size={20} color={colors.white} />
                  <Text style={[styles.reassignButtonText, { color: colors.white }]}>Reassign Dispute</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surface, borderColor: colors.error }]}
                onPress={handleClose}
              >
                <XCircle size={20} color={colors.error} />
                <Text style={[styles.closeButtonText, { color: colors.error }]}>Close Dispute</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.info + "15", borderColor: colors.info + "40" }]}>
          <Text style={[styles.infoBoxTitle, { color: colors.info }]}>Resolution Process</Text>
          <Text style={[styles.infoBoxText, { color: colors.textSecondary }]}>
            1. Internal Discussion - Direct communication between parties{"\n"}
            2. Platform Mediation - Our team facilitates resolution{"\n"}
            3. Professional Mediation - Third-party mediator assists{"\n"}
            4. Legal Review - Legal professionals provide guidance
          </Text>
        </View>
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
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  notFoundText: {
    marginTop: 16,
    fontSize: 18,
    color: staticColors.textTertiary,
  },
  header: {
    padding: 20,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  disputeType: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 2,
  },
  disputeId: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  section: {
    padding: 20,
    backgroundColor: staticColors.surface,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border + "40",
  },
  infoLabel: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  amountText: {
    color: staticColors.error,
  },
  description: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 22,
  },
  evidenceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  evidenceText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  noEvidence: {
    fontSize: 14,
    color: staticColors.textTertiary,
    fontStyle: "italic",
  },
  resolutionSection: {
    backgroundColor: staticColors.primaryLight,
    borderWidth: 1,
    borderColor: staticColors.success + "60",
  },
  resolutionTitle: {
    color: staticColors.success,
  },
  resolvedDate: {
    fontSize: 12,
    color: staticColors.success,
    marginTop: 8,
    fontStyle: "italic",
  },
  textArea: {
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: staticColors.background,
    color: staticColors.text,
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
    marginBottom: 20,
  },
  escalateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: staticColors.surface,
    borderWidth: 2,
    borderColor: staticColors.warning,
    padding: 14,
    borderRadius: 8,
  },
  escalateButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.warning,
  },
  resolveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: staticColors.success,
    padding: 14,
    borderRadius: 8,
  },
  resolveButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: staticColors.surface,
    borderWidth: 2,
    borderColor: staticColors.error,
    padding: 14,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.error,
  },
  reassignButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: staticColors.info,
    padding: 14,
    borderRadius: 8,
  },
  reassignButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
  infoBox: {
    margin: 20,
    padding: 16,
    backgroundColor: staticColors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.info + "40",
    marginBottom: 32,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.info,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 22,
  },
});
