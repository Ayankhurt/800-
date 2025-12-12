import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { adminAPI } from "@/services/api";

interface Payment {
  id: string;
  amount: number;
  status?: string;
  created_at?: string;
  project_id?: string;
}

interface Payout {
  id: string;
  amount: number;
  status?: string;
  created_at?: string;
  user_id?: string;
}

export default function FinanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [financeData, setFinanceData] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      Alert.alert("Unauthorized", "Only Admin users can access this screen.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    }
  }, [user, router]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      console.log("[API] GET /payments");
      console.log("[API] GET /payouts");
      const [paymentsRes, payoutsRes] = await Promise.all([
        adminAPI.getAllPayments(),
        adminAPI.getAllPayouts(),
      ]);

      setPayments(Array.isArray(paymentsRes?.data || paymentsRes) ? (paymentsRes?.data || paymentsRes) : []);
      setPayouts(Array.isArray(payoutsRes?.data || payoutsRes) ? (payoutsRes?.data || payoutsRes) : []);
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
      setPayments([]);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchFinanceData();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFinanceData();
    setRefreshing(false);
  };

  const handlePayoutPress = (payout: Payout) => {
    router.push({
      pathname: "/admin/finance/payout-details",
      params: {
        id: payout.id,
        payoutData: encodeURIComponent(JSON.stringify(payout)),
      },
    } as any);
  };

  const renderPayoutItem = ({ item }: { item: Payout }) => {
    const isPending = item.status?.toLowerCase() === "pending";
    const isApproved = item.status?.toLowerCase() === "approved" || item.status?.toLowerCase() === "completed";
    const isRejected = item.status?.toLowerCase() === "rejected";

    return (
      <TouchableOpacity
        style={styles.payoutCard}
        onPress={() => handlePayoutPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.payoutHeader}>
          <DollarSign size={20} color={Colors.primary} />
          <Text style={styles.payoutAmount}>${item.amount?.toLocaleString() || "0"}</Text>
          {isPending && (
            <View style={[styles.statusBadge, { backgroundColor: Colors.warning + "15", borderColor: Colors.warning }]}>
              <Clock size={12} color={Colors.warning} />
              <Text style={[styles.statusText, { color: Colors.warning }]}>Pending</Text>
            </View>
          )}
          {isApproved && (
            <View style={[styles.statusBadge, { backgroundColor: Colors.success + "15", borderColor: Colors.success }]}>
              <CheckCircle size={12} color={Colors.success} />
              <Text style={[styles.statusText, { color: Colors.success }]}>Approved</Text>
            </View>
          )}
          {isRejected && (
            <View style={[styles.statusBadge, { backgroundColor: Colors.error + "15", borderColor: Colors.error }]}>
              <XCircle size={12} color={Colors.error} />
              <Text style={[styles.statusText, { color: Colors.error }]}>Rejected</Text>
            </View>
          )}
        </View>
        {item.created_at && (
          <Text style={styles.payoutDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
        <Stack.Screen options={{ headerTitle: "Payments & Payouts" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading finance data...</Text>
        </View>
      </View>
    );
  }

  const totalPayments = financeData?.total_payments || financeData?.total_earnings || 0;
  const totalPayouts = financeData?.total_payouts || 0;
  const pendingPayouts = financeData?.pending_balance || 0;
  const pendingPayoutsList = payouts.filter((p) => p.status?.toLowerCase() === "pending");

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: "Payments & Payouts" }} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <TrendingUp size={24} color={Colors.success} />
            <Text style={styles.summaryLabel}>Total Payments</Text>
            <Text style={styles.summaryValue}>${totalPayments.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryCard}>
            <TrendingDown size={24} color={Colors.primary} />
            <Text style={styles.summaryLabel}>Total Payouts</Text>
            <Text style={styles.summaryValue}>${totalPayouts.toLocaleString()}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Clock size={24} color={Colors.warning} />
            <Text style={styles.summaryLabel}>Pending Payouts</Text>
            <Text style={styles.summaryValue}>${pendingPayouts.toLocaleString()}</Text>
          </View>
        </View>

        {/* Pending Payouts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Payouts ({pendingPayoutsList.length})</Text>
          {pendingPayoutsList.length > 0 ? (
            <FlatList
              data={pendingPayoutsList}
              renderItem={renderPayoutItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No pending payouts</Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending payouts</Text>
            </View>
          )}
        </View>

        {/* All Payouts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Payouts ({payouts.length})</Text>
          {payouts.length > 0 ? (
            <FlatList
              data={payouts.slice(0, 10)}
              renderItem={renderPayoutItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payouts found</Text>
            </View>
          )}
        </View>
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
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  payoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
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
  payoutDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

