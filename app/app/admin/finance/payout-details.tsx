import React, { useState, useEffect, useMemo } from "react";
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
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

interface Payout {
  id: string;
  amount: number;
  status?: string;
  created_at?: string;
  user_id?: string;
}

export default function PayoutDetailsScreen() {
  const router = useRouter();
  const { id, payoutData } = useLocalSearchParams();
  const { user, colors } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [payout, setPayout] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const payoutId = Array.isArray(id) ? id[0] : id;
  const payoutDataParam = Array.isArray(payoutData) ? payoutData[0] : payoutData;

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "ADMIN" && payoutId) {
      if (payoutDataParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(payoutDataParam));
          if (parsed && parsed.id === payoutId) {
            setPayout(parsed);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse payout data:", e);
        }
      }
      // Try to fetch from API if available
      fetchPayoutDetails();
    }
  }, [payoutId, user, payoutDataParam]);

  const fetchPayoutDetails = async () => {
    if (!payoutId) return;
    try {
      setLoading(true);
      // Fallback to getAllPayouts since getById might not exist
      console.log("[API] Fetching all payouts to find", payoutId);
      const response = await adminAPI.getAllPayouts();
      const payouts = response?.data?.payouts || response?.payouts || [];
      const payoutArray = Array.isArray(payouts) ? payouts : [];
      const foundPayout = payoutArray.find((p: Payout) => p.id === payoutId);

      if (foundPayout) {
        setPayout(foundPayout);
      }
    } catch (error) {
      console.error("Failed to fetch payout details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (!payoutId) {
      Alert.alert("Error", "Payout ID is missing");
      return;
    }

    const actionName = action === "approve" ? "Approve" : "Reject";
    Alert.alert(`Confirm ${actionName}`, `Are you sure you want to ${actionName.toLowerCase()} this payout?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: actionName,
        onPress: async () => {
          try {
            setActionLoading(true);
            if (action === "approve") {
              console.log("[API] PATCH /admin/payouts/:id/approve", payoutId);
              const response = await adminAPI.approvePayout(payoutId);
              if (response.success) {
                Alert.alert("Success", `Payout ${actionName.toLowerCase()}d successfully`, [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert("Error", response.message || `Failed to ${actionName.toLowerCase()} payout`);
              }
            } else {
              console.log("[API] PATCH /admin/payouts/:id/reject", payoutId);
              const response = await adminAPI.rejectPayout(payoutId);
              if (response.success) {
                Alert.alert("Success", `Payout ${actionName.toLowerCase()}d successfully`, [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert("Error", response.message || `Failed to ${actionName.toLowerCase()} payout`);
              }
            }
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
        <Stack.Screen options={{ headerTitle: "Payout Details" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payout details...</Text>
        </View>
      </View>
    );
  }

  if (!payout) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: "Payout Details" }} />
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Payout not found</Text>
        </View>
      </View>
    );
  }

  const isPending = payout.status?.toLowerCase() === "pending";
  const isApproved = payout.status?.toLowerCase() === "approved" || payout.status?.toLowerCase() === "completed";
  const isRejected = payout.status?.toLowerCase() === "rejected";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Payout Details" }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <DollarSign size={32} color={colors.primary} />
          <Text style={styles.amountText}>${payout.amount?.toLocaleString() || "0"}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isPending
                  ? colors.warning + "15"
                  : isApproved
                    ? colors.success + "15"
                    : colors.error + "15",
                borderColor: isPending ? colors.warning : isApproved ? colors.success : colors.error,
              },
            ]}
          >
            {isPending ? (
              <Clock size={16} color={colors.warning} />
            ) : isApproved ? (
              <CheckCircle size={16} color={colors.success} />
            ) : (
              <XCircle size={16} color={colors.error} />
            )}
            <Text
              style={[
                styles.statusText,
                {
                  color: isPending ? colors.warning : isApproved ? colors.success : colors.error,
                },
              ]}
            >
              {isPending ? "Pending" : isApproved ? "Approved" : "Rejected"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Information</Text>
          {payout.created_at && (
            <View style={styles.infoRow}>
              <Calendar size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created</Text>
                <Text style={styles.infoValue}>
                  {new Date(payout.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
          {payout.user_id && (
            <View style={styles.infoRow}>
              <AlertCircle size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue}>{payout.user_id}</Text>
              </View>
            </View>
          )}
        </View>

        {isPending && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleAction("approve")}
              disabled={actionLoading}
            >
              <CheckCircle size={20} color={colors.success} />
              <Text style={styles.actionButtonText}>Approve Payout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleAction("reject")}
              disabled={actionLoading}
            >
              <XCircle size={20} color={colors.error} />
              <Text style={styles.actionButtonText}>Reject Payout</Text>
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
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amountText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 12,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
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
  approveButton: {
    backgroundColor: colors.success + "15",
    borderColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error + "15",
    borderColor: colors.error,
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
});
