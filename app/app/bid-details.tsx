import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import {
  DollarSign,
  Calendar,
  Users,
  FileText,
  X,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  MessageCircle,
  UserPlus,
  Search,
  Send,
  User as UserIcon,
  AlertCircle,
} from "lucide-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useBids } from "@/contexts/BidsContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useJobs } from "@/contexts/JobsContext";
import { BidSubmission, BidStatus } from "@/types";
import { bidsAPI } from "@/services/api";
import axios from "axios";

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

export default function BidDetailsScreen() {
  const { colors } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getBidById, getSubmissionsByBidId, hasUserSubmitted, awardBid, declineBid } = useBids();
  const { getUserProjects } = useProjects();
  const { sendMessage } = useJobs();
  
  const [apiSubmissions, setApiSubmissions] = useState<BidSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<BidSubmission | null>(null);
  const [selectedTab, setSelectedTab] = useState<"details" | "submissions">("details");

  const bidId = Array.isArray(id) ? id[0] : id;
  const bid = getBidById(bidId as string);

  const isOwner = user && bid && (user.id === bid.projectManagerId || user.role === "PM" || user.role === "ADMIN");
  const isContractor = user?.role === "GC" || user?.role === "SUB" || user?.role === "TS";
  const userSubmitted = user ? hasUserSubmitted(bidId as string, user.id) : false;

  useEffect(() => {
    if (bidId) {
      fetchSubmissions();
    }
  }, [bidId]);

  const fetchSubmissions = async () => {
    if (!bidId) return;
    try {
      setIsLoading(true);
      const response = await bidsAPI.getSubmissions(bidId);
      if (response.success && response.data) {
        const rawSubmissions = response.data.submissions || (Array.isArray(response.data) ? response.data : []);
        const mappedSubmissions = rawSubmissions.map((sub: any) => ({
          id: sub.id || sub.submission_id,
          bidId: sub.bid_id || sub.bidId,
          contractorId: sub.contractor_id || sub.contractorId,
          contractorName: sub.contractor?.fullName || sub.contractor_name || "Contractor",
          contractorCompany: sub.contractor?.company || sub.contractor_company || "",
          amount: sub.amount || sub.bid_amount,
          notes: sub.notes || sub.proposal_text || sub.proposal || "",
          submittedAt: sub.submitted_at || sub.created_at || new Date().toISOString(),
          status: sub.status || "pending",
          documents: sub.documents || [],
          createdBy: sub.created_by || sub.contractor_id,
        }));
        setApiSubmissions(mappedSubmissions);
      }
    } catch (error) {
      console.log("[API ERROR] fetchSubmissions", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions();
    setRefreshing(false);
  };

  if (isLoading && !bid) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      </View>
    );
  }

  if (!bid) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Bid not found</Text>
        </View>
      </View>
    );
  }

  const submissions = apiSubmissions.length > 0 ? apiSubmissions : getSubmissionsByBidId(bidId as string);
  const statusColors: Record<string, string> = {
    pending: colors.warning,
    submitted: colors.info,
    awarded: colors.success,
    declined: colors.error,
  };

  const daysUntilDue = Math.ceil(
    (new Date(bid.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Bid Details", headerShown: true }} />

      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.projectName, { color: colors.text }]}>{bid.projectName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[bid.status] || colors.primary }]}>
          <Text style={[styles.statusText, { color: colors.white }]}>
            {bid.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "details" && styles.tabActive]} 
          onPress={() => setSelectedTab("details")}
        >
          <Text style={[styles.tabText, selectedTab === "details" && { color: colors.primary }]}>Details</Text>
        </TouchableOpacity>
        {(isOwner || isContractor) && (
          <TouchableOpacity 
            style={[styles.tab, selectedTab === "submissions" && styles.tabActive]} 
            onPress={() => setSelectedTab("submissions")}
          >
            <Text style={[styles.tabText, selectedTab === "submissions" && { color: colors.primary }]}>
              Submissions ({submissions.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {selectedTab === "details" ? (
          <View style={styles.detailsContent}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Users size={20} color={colors.primary} />
                <Text style={styles.statValue}>{bid.contractorCount}</Text>
                <Text style={styles.statLabel}>Contractors</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <FileText size={20} color={colors.success} />
                <Text style={styles.statValue}>{submissions.length}</Text>
                <Text style={styles.statLabel}>Submissions</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Clock size={20} color={daysUntilDue > 0 ? colors.warning : colors.error} />
                <Text style={styles.statValue}>{Math.max(0, daysUntilDue)}</Text>
                <Text style={styles.statLabel}>Days Left</Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{bid.description}</Text>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={styles.sectionTitle}>Budget</Text>
              <View style={styles.budgetRow}>
                <DollarSign size={20} color={colors.success} />
                <Text style={styles.budgetValue}>{bid.budget}</Text>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.timelineItem}>
                <Calendar size={18} color={colors.textSecondary} />
                <Text style={styles.timelineText}>Due: {new Date(bid.dueDate).toLocaleDateString()}</Text>
              </View>
            </View>

            {isOwner && bid.status === "pending" && (
              <View style={styles.ownerActions}>
                <TouchableOpacity 
                  style={[styles.primaryAction, { backgroundColor: colors.primary }]}
                  onPress={() => setShowInviteModal(true)}
                >
                  <UserPlus size={20} color={colors.white} />
                  <Text style={styles.actionText}>Invite Contractors</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.secondaryAction, { borderColor: colors.error }]}
                  onPress={() => declineBid(bid.id)}
                >
                  <XCircle size={20} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Cancel Bid Request</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.submissionsList}>
            {submissions.map(sub => (
              <SubmissionCard 
                key={sub.id} 
                submission={sub} 
                colors={colors}
                canAward={isOwner && bid.status === "pending"}
                onAward={() => awardBid(bid.id, sub.id)}
                onMessage={() => {
                  setSelectedSubmission(sub);
                  setShowMessageModal(true);
                }}
              />
            ))}
            {submissions.length === 0 && (
              <Text style={styles.emptyText}>No submissions yet</Text>
            )}
          </View>
        )}
      </ScrollView>

      {isContractor && bid.status === "pending" && !userSubmitted && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowSubmitModal(true)}
          >
            <Text style={styles.submitButtonText}>Submit Bid Proposal</Text>
          </TouchableOpacity>
        </View>
      )}

      {userSubmitted && (
        <View style={styles.footer}>
          <View style={styles.submittedBanner}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={[styles.submittedText, { color: colors.success }]}>Proposal Submitted</Text>
          </View>
        </View>
      )}

      <SubmitBidModal 
        visible={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)}
        bidId={bid.id}
        bidName={bid.projectName}
        colors={colors}
        onSuccess={fetchSubmissions}
      />

      <InviteModal 
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        bidId={bid.id}
        bidName={bid.projectName}
        colors={colors}
      />
      
      <MessageModal
        visible={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        recipientName={selectedSubmission?.contractorName || ""}
        colors={colors}
        onSend={async (msg) => {
          if (selectedSubmission) {
            await sendMessage(bid.id, selectedSubmission.contractorId, msg);
            setShowMessageModal(false);
          }
        }}
      />
    </View>
  );
}

function SubmissionCard({ submission, colors, canAward, onAward, onMessage }: any) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{submission.contractorName}</Text>
          <Text style={styles.cardSubtitle}>{submission.contractorCompany}</Text>
        </View>
        <Text style={[styles.cardAmount, { color: colors.success }]}>${submission.amount.toLocaleString()}</Text>
      </View>
      <Text style={styles.cardNotes} numberOfLines={3}>{submission.notes}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardBtn} onPress={onMessage}>
          <MessageCircle size={18} color={colors.primary} />
          <Text style={{ color: colors.primary }}>Message</Text>
        </TouchableOpacity>
        {canAward && (
          <TouchableOpacity style={[styles.cardBtn, { backgroundColor: colors.success }]} onPress={onAward}>
            <Award size={18} color={colors.white} />
            <Text style={{ color: colors.white }}>Award</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SubmitBidModal({ visible, onClose, bidId, bidName, colors, onSuccess }: any) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !notes) return Alert.alert("Error", "Required fields missing");
    setLoading(true);
    try {
      const res = await bidsAPI.submit(bidId, { amount: parseFloat(amount), notes });
      if (res.success) {
        Alert.alert("Success", "Bid submitted!");
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      Alert.alert("Error", "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Submit Proposal</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.text} /></TouchableOpacity>
        </View>
        <Text style={{ marginBottom: 20 }}>Project: {bidName}</Text>
        <TextInput 
          placeholder="Amount ($)" 
          keyboardType="numeric" 
          style={styles.modalInput} 
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput 
          placeholder="Proposal / Notes" 
          multiline 
          numberOfLines={6} 
          style={[styles.modalInput, { height: 120 }]} 
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? "Submitting..." : "Submit Proposal"}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function InviteModal({ visible, onClose, bidId, bidName, colors }: any) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { sendMessage } = useJobs();

  useEffect(() => {
    if (visible) fetchUsers();
  }, [visible]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/users?role=CONTRACTOR`);
      if (response.data?.success) setUsers(response.data.data || []);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleInvite = async (userId: string, name: string) => {
    try {
      await sendMessage(bidId, userId, `Hi ${name}! I invite you to bid on: ${bidName}`);
      Alert.alert("Sent", `Invitation sent to ${name}`);
    } catch (e) {
      Alert.alert("Error", "Failed to send invitation");
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 50 }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Invite Contractors</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.text} /></TouchableOpacity>
        </View>
        <TextInput placeholder="Search..." style={styles.modalInput} value={search} onChangeText={setSearch} />
        <ScrollView>
          {users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase())).map(u => (
            <View key={u.id} style={styles.inviteRow}>
              <View>
                <Text style={styles.cardTitle}>{u.fullName}</Text>
                <Text style={styles.cardSubtitle}>{u.company_name}</Text>
              </View>
              <TouchableOpacity onPress={() => handleInvite(u.id, u.fullName)}>
                <Send size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function MessageModal({ visible, onClose, recipientName, onSend, colors }: any) {
  const [msg, setMsg] = useState("");
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20 }}>
          <Text style={styles.modalTitle}>Message to {recipientName}</Text>
          <TextInput 
            multiline 
            style={[styles.modalInput, { height: 100, marginTop: 10 }]} 
            placeholder="Type your message..." 
            value={msg}
            onChangeText={setMsg}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity style={{ flex: 1, padding: 12 }} onPress={onClose}><Text style={{ textAlign: 'center' }}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity 
              style={{ flex: 1, padding: 12, backgroundColor: colors.primary, borderRadius: 10 }} 
              onPress={() => onSend(msg)}
            >
              <Text style={{ textAlign: 'center', color: colors.white }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, borderBottomWidth: 1 },
  projectName: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: staticColors.primary },
  tabText: { fontWeight: '600', color: '#666' },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#666' },
  section: { padding: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  descriptionText: { color: '#444', lineHeight: 22 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetValue: { fontSize: 20, fontWeight: '700' },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineText: { color: '#666' },
  ownerActions: { padding: 16, gap: 12 },
  primaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 12, borderWidth: 1 },
  actionText: { fontWeight: '700', color: '#fff' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  submitButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  submittedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submittedText: { fontWeight: '700' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 14, color: '#666' },
  cardAmount: { fontSize: 18, fontWeight: '700' },
  cardNotes: { color: '#444', marginBottom: 15 },
  cardActions: { flexDirection: 'row', gap: 10 },
  cardBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, marginBottom: 15 },
  inviteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
});
