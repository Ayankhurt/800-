import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { AlertCircle, FileText, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react-native";
import { useDisputes } from "@/contexts/DisputesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dispute, DisputeType } from "@/types";
import { disputesAPI } from "@/services/api";

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

const DisputeStatusBadge: React.FC<{ status: Dispute["status"], colors: any }> = ({ status, colors }) => {
  const config: Record<string, { bg: string, color: any, label: string }> = {
    filed: { bg: colors.warning + '20', color: colors.warning, label: "Filed" },
    under_review: { bg: colors.info + '20', color: colors.info, label: "Under Review" },
    in_mediation: { bg: colors.secondary + '20', color: colors.secondary, label: "In Mediation" },
    resolved: { bg: colors.success + '20', color: colors.success, label: "Resolved" },
    closed: { bg: colors.border, color: colors.textSecondary, label: "Closed" },
  };

  const style = config[status] || config.filed;

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.color }]}>{style.label}</Text>
    </View>
  );
};

const DisputeCard: React.FC<{ dispute: Dispute; onPress: () => void; colors: any }> = ({
  dispute,
  onPress,
  colors,
}) => {
  const getStatusIcon = () => {
    switch (dispute.status) {
      case "filed":
        return <AlertCircle size={20} color={colors.warning} />;
      case "under_review":
        return <Clock size={20} color={colors.info} />;
      case "in_mediation":
        return <FileText size={20} color={colors.secondary} />;
      case "resolved":
        return <CheckCircle size={20} color={colors.success} />;
      case "closed":
        return <XCircle size={20} color={colors.textTertiary} />;
    }
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>{getStatusIcon()}</View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{dispute.disputeType.replace("_", " ").toUpperCase()}</Text>
            <DisputeStatusBadge status={dispute.status} colors={colors} />
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {dispute.description}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>Filed by: {dispute.filedByName}</Text>
            <Text style={[styles.metaText, { color: colors.textTertiary }]}>
              {new Date(dispute.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {dispute.amountDisputed && (
            <Text style={[styles.amountText, { color: colors.error }]}>
              Amount in dispute: ${dispute.amountDisputed.toLocaleString()}
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

export default function DisputesPage() {
  const { user, colors } = useAuth();
  const { projectId: initialProjectId } = useLocalSearchParams();
  const { disputes: contextDisputes, fileDispute: contextFileDispute, isLoading: contextLoading } = useDisputes();
  const [apiDisputes, setApiDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewDispute, setShowNewDispute] = useState(!!initialProjectId);
  const [newDispute, setNewDispute] = useState({
    projectId: (initialProjectId as string) || "",
    type: "quality" as DisputeType,
    description: "",
    amount: "",
  });

  // Fetch disputes from API
  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log("[API] GET /disputes");
      const response = await disputesAPI.getAll();

      if (response.success && response.data) {
        const mappedDisputes = Array.isArray(response.data) ? response.data.map((dispute: any) => ({
          id: dispute.id || dispute.dispute_id,
          projectId: dispute.project_id || dispute.projectId,
          disputeType: (dispute.dispute_type || dispute.disputeType || "quality") as DisputeType,
          description: dispute.description,
          status: (dispute.status || "filed") as Dispute["status"],
          filedBy: dispute.filed_by || dispute.filedBy || user.id,
          filedByName: dispute.filed_by_name || dispute.filedByName || user.fullName,
          amountDisputed: dispute.amount_disputed || dispute.amountDisputed,
          createdAt: dispute.created_at || dispute.createdAt,
          updatedAt: dispute.updated_at || dispute.updatedAt,
        })) : [];
        setApiDisputes(mappedDisputes);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch disputes:", error);
      Alert.alert("Error", "Failed to load disputes. Please try again.");
      // Fallback to context
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDisputes();
    setRefreshing(false);
  };

  // Visible for Admin only
  const isAdmin = user?.role === "ADMIN";

  // Use API disputes if available, otherwise fallback to context
  const disputes = apiDisputes.length > 0 ? apiDisputes : contextDisputes;

  // Admin sees all disputes, others see only their own
  const userDisputes = isAdmin
    ? disputes
    : disputes.filter(
      (d) => d.filedBy === user?.id || d.projectId.includes(user?.id || "")
    );

  const activeDisputes = userDisputes.filter(
    (d) => d.status !== "resolved" && d.status !== "closed"
  );

  const handleFileDispute = async () => {
    if (!newDispute.description.trim()) {
      Alert.alert("Error", "Please provide a description");
      return;
    }

    if (!user) return;

    try {
      setIsLoading(true);
      console.log("[API] POST /disputes", newDispute);

      const backendData = {
        project_id: newDispute.projectId || null,
        dispute_type: newDispute.type,
        description: newDispute.description,
        amount_disputed: newDispute.amount ? parseFloat(newDispute.amount) : null,
      };

      const response = await disputesAPI.create(backendData);

      if (response.success) {
        Alert.alert("Success", "Dispute filed successfully");
        setShowNewDispute(false);
        setNewDispute({
          projectId: "",
          type: "quality",
          description: "",
          amount: "",
        });
        // Refresh disputes list
        await fetchDisputes();
      } else {
        Alert.alert("Error", response.message || "Failed to file dispute");
      }
    } catch (error: any) {
      console.error("[API] Failed to file dispute:", error);
      Alert.alert("Error", error.response?.data?.message || error.message || "Failed to file dispute. Please try again.");
      // Fallback to context
      contextFileDispute(
        newDispute.projectId || "project-1",
        newDispute.type,
        newDispute.description,
        { photos: [], documents: [], messages: [] },
        parseFloat(newDispute.amount) || undefined,
        "Seeking resolution"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Dispute Resolution",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {isLoading && userDisputes.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading disputes...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Dispute Management</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Resolve issues through our structured mediation process
              </Text>
            </View>

            <View style={styles.stats}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>{activeDisputes.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Disputes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {userDisputes.filter((d) => d.status === "resolved").length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.newDisputeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowNewDispute(!showNewDispute)}
            >
              <Text style={styles.newDisputeButtonText}>
                {showNewDispute ? "Cancel" : "File New Dispute"}
              </Text>
            </TouchableOpacity>

            {showNewDispute && (
              <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.formTitle, { color: colors.text }]}>File a New Dispute</Text>

                <Text style={[styles.label, { color: colors.textSecondary }]}>Dispute Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                  {(["payment", "quality", "scope", "timeline", "damage", "safety", "contract"] as DisputeType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        newDispute.type === type && [styles.typeButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                      ]}
                      onPress={() => setNewDispute({ ...newDispute, type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          { color: colors.textSecondary },
                          newDispute.type === type && [styles.typeButtonTextActive, { color: colors.white }],
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { color: colors.textSecondary }]}>Description *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  value={newDispute.description}
                  onChangeText={(text) => setNewDispute({ ...newDispute, description: text })}
                />

                <Text style={[styles.label, { color: colors.textSecondary }]}>Amount in Dispute (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  value={newDispute.amount}
                  onChangeText={(text) => setNewDispute({ ...newDispute, amount: text })}
                />

                <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.success }]} onPress={handleFileDispute}>
                  <Text style={styles.submitButtonText}>Submit Dispute</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Disputes</Text>
              {activeDisputes.length === 0 ? (
                <View style={styles.emptyState}>
                  <CheckCircle size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No active disputes</Text>
                </View>
              ) : (
                activeDisputes.map((dispute) => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={dispute}
                    colors={colors}
                    onPress={() => router.push(`/dispute-details?id=${dispute.id}`)}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Resolved Disputes</Text>
              {userDisputes
                .filter((d) => d.status === "resolved" || d.status === "closed")
                .map((dispute) => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={dispute}
                    colors={colors}
                    onPress={() => router.push(`/dispute-details?id=${dispute.id}`)}
                  />
                ))}
            </View>

            <View style={[styles.infoContainer, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
              <Text style={[styles.infoTitle, { color: colors.primary }]}>Dispute Resolution Process</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                1. File Dispute - Submit your concern{"\n"}
                2. Internal Review - Both parties discuss{"\n"}
                3. Platform Mediation - Our team assists{"\n"}
                4. Professional Mediation - Third-party review{"\n"}
                5. Resolution - Agreement reached
              </Text>
            </View>
          </>
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
  header: {
    padding: 20,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  stats: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: staticColors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  newDisputeButton: {
    margin: 16,
    marginTop: 8,
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  newDisputeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
  formContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
    marginBottom: 8,
  },
  typeScroll: {
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
    backgroundColor: staticColors.surface,
  },
  typeButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  typeButtonTextActive: {
    color: staticColors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: staticColors.surface,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: staticColors.surface,
  },
  submitButton: {
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#ef4444",
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
  },
  infoContainer: {
    margin: 16,
    marginTop: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#93c5fd",
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#1e40af",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1e3a8a",
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
  }
});
