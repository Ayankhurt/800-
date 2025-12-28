import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    FileText,
    CheckCircle,
    XCircle,
    PenTool,
    Shield,
    Calendar,
    DollarSign,
    Info,
    ArrowLeft
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";

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

export default function ContractReviewScreen() {
    const { projectId } = useLocalSearchParams();
    const router = useRouter();
    const { user, colors } = useAuth();
    const { getProjectById, getScopeByProjectId, getContractByProjectId, signContract, updateProjectStatus } = useProjects();

    const project = getProjectById(projectId as string);
    const scope = getScopeByProjectId(projectId as string);
    const contract = getContractByProjectId(projectId as string);

    const [signature, setSignature] = useState("");
    const [isSigning, setIsSigning] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        if (user) {
            setSignature(user.fullName || "");
        }
    }, [user]);

    if (!project || !contract || !scope) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Contract information not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isOwner = user?.id === project.ownerId;
    const isSignedByThisUser = isOwner ? contract.ownerSigned : contract.contractorSigned;

    const handleSign = async () => {
        if (!signature.trim()) {
            Alert.alert("Error", "Please enter your full name as signature");
            return;
        }
        if (!agreedToTerms) {
            Alert.alert("Error", "You must agree to the terms and conditions");
            return;
        }

        try {
            setIsSigning(true);
            await signContract(contract.id, signature, isOwner ? "owner" : "contractor");

            // If both signed, move project to active
            const updatedContract = { ...contract };
            if (isOwner) updatedContract.ownerSigned = true;
            else updatedContract.contractorSigned = true;

            if (updatedContract.ownerSigned && updatedContract.contractorSigned) {
                // In a real app, this would also trigger escrow initialization
                // For core workflow, we move to active
                // We'll simulate a small delay for "escrow setup"
                setTimeout(async () => {
                    await updateProjectStatus(project.id, "active");
                    Alert.alert("Success", "Contract fully executed! Project is now Active.");
                    router.back();
                }, 1000);
            } else {
                Alert.alert("Success", "Contract signed. Waiting for the other party.");
                router.back();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to sign contract");
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Legal Agreement",
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.docHeader, { borderBottomColor: colors.border }]}>
                    <Shield size={40} color={colors.primary} />
                    <Text style={[styles.docTitle, { color: colors.text }]}>Construction Services Agreement</Text>
                    <Text style={[styles.docSubtitle, { color: colors.textSecondary }]}>
                        Project: {project.title}
                    </Text>
                    <Text style={[styles.docDate, { color: colors.textTertiary }]}>
                        Generated on {new Date(contract.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                {/* Scope of Work Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <FileText size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Scope of Work</Text>
                    </View>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        The Contractor shall perform the following work phases as detailed in the technical specifications:
                    </Text>
                    {scope.workBreakdown?.phases?.map((phase: any, i: number) => (
                        <View key={i} style={styles.phaseItem}>
                            <Text style={[styles.phaseName, { color: colors.text }]}>{i + 1}. {phase.name}</Text>
                            <Text style={[styles.phaseText, { color: colors.textSecondary }]}>• {phase.tasks?.join(', ')}</Text>
                        </View>
                    ))}
                </View>

                {/* Payment Milestones */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <DollarSign size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Payment Schedule</Text>
                    </View>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        Payments will be released from escrow upon milestone completion and owner approval.
                    </Text>
                    {contract.paymentSchedule?.map((milestone: any, i: number) => (
                        <View key={i} style={[styles.milestoneRow, { borderBottomColor: colors.border + '40' }]}>
                            <Text style={[styles.milestoneName, { color: colors.text }]}>{milestone.milestone || milestone.title}</Text>
                            <Text style={[styles.milestonePrice, { color: colors.primary }]}>${(milestone.amount || 0).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                {/* Legal Terms */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Shield size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Legal Provisions</Text>
                    </View>
                    <View style={[styles.legalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.legalText, { color: colors.textSecondary }]}>
                            <Text style={{ fontWeight: 'bold' }}>Governing Law: </Text>
                            This contract is governed by the laws of the State of California, including Section 7159 of the Business and Professions Code.
                            {"\n\n"}
                            <Text style={{ fontWeight: 'bold' }}>Insurance: </Text>
                            {contract.insuranceRequirements?.description || 'Standard insurance coverage required.'}
                            {"\n\n"}
                            <Text style={{ fontWeight: 'bold' }}>Warranty: </Text>
                            {contract.warrantyTerms?.description || 'Standard 1-year warranty on workmanship.'}
                            {"\n\n"}
                            <Text style={{ fontWeight: 'bold' }}>Dispute Resolution: </Text>
                            {contract.disputeResolution?.method || 'Internal resolution followed by mediation.'}
                        </Text>
                    </View>
                </View>

                {/* Signature Section */}
                {!isSignedByThisUser ? (
                    <View style={[styles.signSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.signTitle, { color: colors.text }]}>Digital Signature</Text>
                        <Text style={[styles.signLabel, { color: colors.textSecondary }]}>Type your full name as it appears on your ID</Text>
                        <TextInput
                            style={[styles.signInput, { borderColor: colors.border, color: colors.text }]}
                            value={signature}
                            onChangeText={setSignature}
                            placeholder="Full Legal Name"
                            placeholderTextColor={colors.textTertiary}
                        />

                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setAgreedToTerms(!agreedToTerms)}
                        >
                            <View style={[styles.checkbox, { borderColor: colors.primary }, agreedToTerms && { backgroundColor: colors.primary }]}>
                                {agreedToTerms && <CheckCircle size={14} color="#fff" />}
                            </View>
                            <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
                                I have read and agree to all terms of this contract and understand that this signature is legally binding.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSign}
                            disabled={isSigning}
                        >
                            {isSigning ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <PenTool size={20} color="#fff" />
                                    <Text style={styles.submitBtnText}>Sign and Execute</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.signedBox, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                        <CheckCircle size={24} color={colors.success} />
                        <Text style={[styles.signedText, { color: colors.success }]}>
                            You signed this contract on {new Date((isOwner ? contract.ownerSignedAt : contract.contractorSignedAt) || Date.now()).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Info size={16} color={colors.textTertiary} />
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                        Escrow initialization will proceed automatically after both parties sign.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    scrollContent: { padding: 20, paddingBottom: 50 },
    docHeader: {
        alignItems: 'center',
        paddingBottom: 25,
        borderBottomWidth: 1,
        marginBottom: 25,
    },
    docTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 5,
    },
    docSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 5,
    },
    docDate: {
        fontSize: 12,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    sectionBody: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 10,
    },
    phaseItem: {
        marginBottom: 10,
        paddingLeft: 10,
    },
    phaseName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    phaseText: {
        fontSize: 13,
    },
    milestoneRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    milestoneName: {
        fontSize: 14,
        fontWeight: '500',
    },
    milestonePrice: {
        fontSize: 14,
        fontWeight: '700',
    },
    legalBox: {
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
    },
    legalText: {
        fontSize: 13,
        lineHeight: 20,
    },
    signSection: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 10,
    },
    signTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
    },
    signLabel: {
        fontSize: 12,
        marginBottom: 8,
    },
    signInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        fontWeight: '600',
        fontStyle: 'italic',
        marginBottom: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 25,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 10,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    signedBox: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginTop: 10,
    },
    signedText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    footerStatus: {
        backgroundColor: staticColors.primaryLight,
        padding: 15,
        borderRadius: 10,
        marginBottom: 30,
    },
    footer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 30,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    footerText: {
        flex: 1,
        fontSize: 11,
    }
});
