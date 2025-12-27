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
    CheckCircle,
    XCircle,
    Star,
    Clipboard,
    Package,
    ArrowRight,
    ArrowLeft,
    Plus,
    Archive
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

export default function ProjectCloseoutScreen() {
    const { projectId } = useLocalSearchParams();
    const router = useRouter();
    const { user, colors } = useAuth();
    const {
        getProjectById,
        getPunchListByProjectId,
        addPunchListItem,
        updatePunchListItem,
        updateProjectStatus
    } = useProjects();

    const project = getProjectById(projectId as string);
    const punchList = getPunchListByProjectId(projectId as string);

    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [newItemText, setNewItemText] = useState("");
    const [isFinishing, setIsFinishing] = useState(false);

    if (!project) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Project not found.</Text>
            </View>
        );
    }

    const isOwner = user?.id === project.ownerId;
    const allPunchItemsDone = punchList.length > 0 && punchList.every(item => item.status === 'completed');

    const handleAddPunchItem = async () => {
        if (!newItemText.trim()) return;
        await addPunchListItem({
            projectId: project.id,
            description: newItemText,
            location: "Site", // Default for core
            priority: "medium", // Default for core
            status: 'pending',
            photos: [],
        });
        setNewItemText("");
    };

    const handleTogglePunchItem = async (item: any) => {
        // Only contractor can mark done, or both? Usually contractor marks done, owner verifies.
        // For simplicity: anyone can toggle for now.
        const newStatus = item.status === 'pending' ? 'completed' : 'pending';
        await updatePunchListItem(item.id, { status: newStatus });
    };

    const handleFinalize = async () => {
        if (!allPunchItemsDone && punchList.length > 0) {
            Alert.alert("Warning", "Please complete all punch list items before finalizing.");
            return;
        }

        if (isOwner && rating === 0) {
            Alert.alert("Error", "Please rate the contractor's performance.");
            return;
        }

        try {
            setIsFinishing(true);
            // In a real app, this would trigger the release of 10% retainage
            await updateProjectStatus(project.id, "completed");

            Alert.alert(
                "Project Closed Successfully",
                "Final payment has been released. Media archive is now available in your documents.",
                [{ text: "Great!", onPress: () => router.push("/(tabs)/projects" as any) }]
            );
        } catch (error) {
            Alert.alert("Error", "Failed to finalize project");
        } finally {
            setIsFinishing(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Project Closeout",
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Archive size={40} color={colors.primary} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Final Inspection & Closeout</Text>
                    <Text style={[styles.headerDesc, { color: colors.textSecondary }]}>
                        Review the digital punch list and finalize the project to release final funds.
                    </Text>
                </View>

                {/* Digital Punch List */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <Clipboard size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Digital Punch List</Text>
                    </View>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                        Items found during final walkthrough that need correction.
                    </Text>

                    {punchList.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.punchItem, { borderBottomColor: colors.border + '40' }]}
                            onPress={() => handleTogglePunchItem(item)}
                        >
                            <View style={[
                                styles.checkbox,
                                { borderColor: item.status === 'completed' ? colors.success : colors.border },
                                item.status === 'completed' && { backgroundColor: colors.success }
                            ]}>
                                {item.status === 'completed' && <CheckCircle size={14} color="#fff" />}
                            </View>
                            <Text style={[
                                styles.punchText,
                                { color: item.status === 'completed' ? colors.textTertiary : colors.text },
                                item.status === 'completed' && { textDecorationLine: 'line-through' }
                            ]}>
                                {item.description}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.addPunchRow}>
                        <TextInput
                            style={[styles.punchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Add item (e.g., touch up paint in hall)"
                            placeholderTextColor={colors.textTertiary}
                            value={newItemText}
                            onChangeText={setNewItemText}
                        />
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: colors.primary }]}
                            onPress={handleAddPunchItem}
                        >
                            <Plus size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Media Archive Info */}
                <View style={[styles.card, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '20' }]}>
                    <View style={styles.cardHeader}>
                        <Package size={20} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.primary }]}>Media Archive Ready</Text>
                    </View>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Upon finalization, all {project.title} project photos, daily updates, and contracts will be compiled into a permanent digital archive (PDF/ZIP).
                    </Text>
                </View>

                {/* Rating & Feedback (Owner Only) */}
                {isOwner && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Rate the Contractor</Text>
                        <View style={styles.starRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                                    <Star
                                        size={32}
                                        color={s <= rating ? staticColors.warning : colors.border}
                                        fill={s <= rating ? staticColors.warning : 'transparent'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="Share your experience working on this project..."
                            placeholderTextColor={colors.textTertiary}
                            multiline
                            numberOfLines={4}
                            value={feedback}
                            onChangeText={setFeedback}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.finalizeBtn,
                        { backgroundColor: colors.success },
                        (!allPunchItemsDone && punchList.length > 0) && { opacity: 0.5 }
                    ]}
                    onPress={handleFinalize}
                    disabled={isFinishing}
                >
                    {isFinishing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <CheckCircle size={20} color="#fff" />
                            <Text style={styles.finalizeBtnText}>Release Final Payment & Close Project</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.footerInfo}>
                    <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                        Note: This will release the final 10% retainage held in escrow.
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
    header: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 15,
        marginBottom: 8,
    },
    headerDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    cardDesc: {
        fontSize: 13,
        marginBottom: 15,
    },
    punchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    punchText: {
        flex: 1,
        fontSize: 15,
    },
    addPunchRow: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 10,
    },
    punchInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 13,
        lineHeight: 18,
    },
    starRow: {
        flexDirection: 'row',
        gap: 10,
        marginVertical: 15,
        justifyContent: 'center',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 14,
    },
    finalizeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        gap: 10,
        marginTop: 10,
    },
    finalizeBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    footerInfo: {
        marginTop: 15,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
    }
});
