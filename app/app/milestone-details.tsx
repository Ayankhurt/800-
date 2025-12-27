import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    FileText,
    Image as ImageIcon,
    Send,
    ArrowLeft,
    Info
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { milestonesAPI, uploadAPI } from "@/services/api";
import * as ImagePicker from 'expo-image-picker';

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

export default function MilestoneDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, colors } = useAuth();

    const milestoneId = Array.isArray(id) ? id[0] : id;

    const [milestone, setMilestone] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [proofUrl, setProofUrl] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (milestoneId) {
            fetchMilestone();
        }
    }, [milestoneId]);

    const fetchMilestone = async () => {
        try {
            setLoading(true);
            const response = await milestonesAPI.getById(milestoneId);
            if (response.success) {
                setMilestone(response.data);
            }
        } catch (error: any) {
            console.error("Fetch milestone error:", error);
            Alert.alert("Error", "Failed to load milestone details");
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0].uri) {
            uploadProof(result.assets[0].uri);
        }
    };

    const uploadProof = async (uri: string) => {
        try {
            setActionLoading(true);
            const formData = new FormData();
            // @ts-ignore
            formData.append('file', {
                uri,
                name: 'proof.jpg',
                type: 'image/jpeg',
            });

            const response = await uploadAPI.uploadDocument(formData);
            if (response.success) {
                setProofUrl(response.data.url);
                Alert.alert("Success", "Proof image uploaded");
            }
        } catch (error) {
            console.error("Upload error:", error);
            Alert.alert("Error", "Failed to upload proof image");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitMilestone = async () => {
        if (!proofUrl) {
            Alert.alert("Error", "Please upload a proof image or document link");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await milestonesAPI.submit(milestoneId, { proof_url: proofUrl });
            if (response.success) {
                Alert.alert("Success", "Milestone submitted for review");
                fetchMilestone();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to submit milestone");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        Alert.alert(
            "Approve Milestone",
            "Are you sure? This will release the payment to the contractor.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            const response = await milestonesAPI.approve(milestoneId);
                            if (response.success) {
                                Alert.alert("Success", "Milestone approved and payment released");
                                fetchMilestone();
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to approve milestone");
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async () => {
        if (!rejectionReason) {
            Alert.alert("Error", "Please provide a reason for rejection");
            return;
        }

        try {
            setActionLoading(true);
            const response = await milestonesAPI.reject(milestoneId, rejectionReason);
            if (response.success) {
                Alert.alert("Success", "Milestone rejected with feedback");
                fetchMilestone();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to reject milestone");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!milestone) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Milestone not found</Text>
            </View>
        );
    }

    const isContractor = user?.id === milestone.contractor_id || user?.id === milestone.project?.contractor_id;
    const isOwner = user?.id === milestone.project?.owner_id;
    const status = milestone.status;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Milestone Details",
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Banner */}
                <View style={[
                    styles.statusBanner,
                    {
                        backgroundColor:
                            status === 'approved' ? colors.success + '20' :
                                status === 'submitted' ? colors.warning + '20' :
                                    status === 'rejected' ? colors.error + '20' :
                                        colors.border + '50'
                    }
                ]}>
                    <View style={styles.statusLabelRow}>
                        {status === 'approved' ? <CheckCircle size={20} color={colors.success} /> :
                            status === 'submitted' ? <Clock size={20} color={colors.warning} /> :
                                status === 'rejected' ? <XCircle size={20} color={colors.error} /> :
                                    <Info size={20} color={colors.textSecondary} />}
                        <Text style={[styles.statusText, {
                            color:
                                status === 'approved' ? colors.success :
                                    status === 'submitted' ? colors.warning :
                                        status === 'rejected' ? colors.error :
                                            colors.textSecondary
                        }]}>
                            {status.toUpperCase().replace('_', ' ')}
                        </Text>
                    </View>
                    {status === 'rejected' && milestone.rejection_reason && (
                        <Text style={[styles.rejectionText, { color: colors.error }]}>
                            Feedback: {milestone.rejection_reason}
                        </Text>
                    )}
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{milestone.title}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{milestone.description}</Text>

                    <View style={styles.amountBox}>
                        <DollarSign size={18} color={colors.primary} />
                        <Text style={[styles.amountText, { color: colors.primary }]}>
                            ${(milestone.payment_amount || 0).toLocaleString()}
                        </Text>
                    </View>

                    <View style={styles.dueBox}>
                        <Clock size={16} color={colors.textTertiary} />
                        <Text style={[styles.dueText, { color: colors.textSecondary }]}>
                            Due: {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'TBD'}
                        </Text>
                    </View>
                </View>

                {/* Deliverables */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Deliverables</Text>
                    {milestone.deliverables?.map((item: string, i: number) => (
                        <View key={i} style={styles.listItem}>
                            <CheckCircle size={14} color={colors.success} />
                            <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Submission Proof / Review Actions */}
                {status === 'submitted' && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Submission Proof</Text>
                        {milestone.proof_url ? (
                            <Image
                                source={{ uri: milestone.proof_url }}
                                style={styles.proofImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={{ color: colors.textSecondary }}>No visual proof provided.</Text>
                        )}

                        {isOwner && (
                            <View style={styles.actionColumn}>
                                <Text style={[styles.label, { color: colors.text, marginTop: 15 }]}>Review Feedback (if rejecting)</Text>
                                <TextInput
                                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                    placeholder="Why are you rejecting this work?"
                                    placeholderTextColor={colors.textTertiary}
                                    value={rejectionReason}
                                    onChangeText={setRejectionReason}
                                    multiline
                                />
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnError]}
                                        onPress={handleReject}
                                        disabled={actionLoading}
                                    >
                                        <Text style={styles.btnText}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.btn, styles.btnSuccess]}
                                        onPress={handleApprove}
                                        disabled={actionLoading}
                                    >
                                        <Text style={styles.btnText}>Approve & Pay</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Contractor Submission Form */}
                {isContractor && (status === 'pending' || status === 'rejected') && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Submit Work</Text>
                        <Text style={[styles.helper, { color: colors.textSecondary }]}>
                            Upload completion photos or documents to request payment.
                        </Text>

                        <TouchableOpacity
                            style={[styles.uploadButton, { borderColor: colors.primary }]}
                            onPress={handlePickImage}
                        >
                            {proofUrl ? (
                                <Image source={{ uri: proofUrl }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <ImageIcon size={32} color={colors.primary} />
                                    <Text style={{ color: colors.primary, marginTop: 5 }}>Attach Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmitMilestone}
                            disabled={isSubmitting || actionLoading}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit Milestone</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: "center", alignItems: "center" },
    scrollContent: { padding: 16, paddingBottom: 40 },
    statusBanner: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusText: { fontSize: 16, fontWeight: '700' },
    rejectionText: { marginTop: 8, fontSize: 14 },
    card: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 15 },
    amountBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
    amountText: { fontSize: 18, fontWeight: '700' },
    dueBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dueText: { fontSize: 13 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    listText: { fontSize: 14 },
    proofImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 10 },
    actionColumn: { width: '100%' },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 15,
    },
    buttonRow: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
    btnError: { backgroundColor: staticColors.error },
    btnSuccess: { backgroundColor: staticColors.success },
    btnText: { color: '#fff', fontWeight: '700' },
    helper: { fontSize: 13, marginBottom: 15 },
    uploadButton: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    uploadPlaceholder: { alignItems: 'center' },
    previewImage: { width: '100%', height: '100%' },
    submitButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
