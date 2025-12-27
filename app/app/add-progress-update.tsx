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
    Camera,
    Image as ImageIcon,
    Send,
    X,
    Plus
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { progressUpdatesAPI, milestonesAPI, uploadAPI } from "@/services/api";
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

export default function AddProgressUpdateScreen() {
    const { projectId } = useLocalSearchParams();
    const router = useRouter();
    const { colors } = useAuth();

    const [milestones, setMilestones] = useState<any[]>([]);
    const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
    const [workCompleted, setWorkCompleted] = useState("");
    const [workPlanned, setWorkPlanned] = useState("");
    const [issues, setIssues] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [milestonesLoading, setMilestonesLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            fetchMilestones();
        }
    }, [projectId]);

    const fetchMilestones = async () => {
        try {
            setMilestonesLoading(true);
            const response = await milestonesAPI.getByProject(projectId as string);
            if (response.success) {
                setMilestones(response.data);
            }
        } catch (error) {
            console.error("Fetch milestones error:", error);
        } finally {
            setMilestonesLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const uris = result.assets.map(a => a.uri);
            uploadPhotos(uris);
        }
    };

    const uploadPhotos = async (uris: string[]) => {
        try {
            setLoading(true);
            const uploadedUrls: string[] = [];

            for (const uri of uris) {
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri,
                    name: 'progress.jpg',
                    type: 'image/jpeg',
                });

                const response = await uploadAPI.uploadDocument(formData);
                if (response.success) {
                    uploadedUrls.push(response.data.url);
                }
            }

            setPhotos([...photos, ...uploadedUrls]);
        } catch (error) {
            Alert.alert("Error", "Failed to upload one or more photos");
        } finally {
            setLoading(false);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!workCompleted) {
            Alert.alert("Error", "Please describe work completed today");
            return;
        }

        try {
            setLoading(true);
            const data = {
                milestone_id: selectedMilestoneId || null,
                update_type: 'daily',
                work_completed: workCompleted,
                work_planned: workPlanned,
                issues: issues,
                photos: photos,
            };

            const response = await progressUpdatesAPI.create(projectId as string, data);
            if (response.success) {
                Alert.alert("Success", "Daily update posted successfully");
                router.back();
            }
        } catch (error: any) {
            Alert.alert("Error", "Failed to post update: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Post Daily Update",
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Related Milestone (Optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestoneScroll}>
                        {milestones.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={[
                                    styles.milestoneChip,
                                    { borderColor: colors.border },
                                    selectedMilestoneId === m.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                                onPress={() => setSelectedMilestoneId(selectedMilestoneId === m.id ? "" : m.id)}
                            >
                                <Text style={[
                                    styles.milestoneChipText,
                                    { color: colors.textSecondary },
                                    selectedMilestoneId === m.id && { color: "#fff" }
                                ]}>
                                    {m.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { color: colors.text }]}>What was completed today?</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                        placeholder="Describe the tasks finished..."
                        placeholderTextColor={colors.textTertiary}
                        value={workCompleted}
                        onChangeText={setWorkCompleted}
                        multiline
                    />

                    <Text style={[styles.label, { color: colors.text }]}>What's planned for tomorrow?</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                        placeholder="Next steps..."
                        placeholderTextColor={colors.textTertiary}
                        value={workPlanned}
                        onChangeText={setWorkPlanned}
                        multiline
                    />

                    <Text style={[styles.label, { color: colors.text }]}>Any issues or delays?</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                        placeholder="Weather, materials, etc (optional)"
                        placeholderTextColor={colors.textTertiary}
                        value={issues}
                        onChangeText={setIssues}
                        multiline
                    />

                    <Text style={[styles.label, { color: colors.text }]}>Progress Photos</Text>
                    <View style={styles.photoGrid}>
                        {photos.map((url, index) => (
                            <View key={index} style={styles.photoWrapper}>
                                <Image source={{ uri: url }} style={styles.photo} />
                                <TouchableOpacity
                                    style={styles.removePhotoButton}
                                    onPress={() => removePhoto(index)}
                                >
                                    <X size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity
                            style={[styles.addPhotoButton, { borderColor: colors.border }]}
                            onPress={handlePickImage}
                        >
                            <Plus size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>Post Update</Text>
                    )}
                </TouchableOpacity>
            </ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 12 },
    milestoneScroll: { marginBottom: 15 },
    milestoneChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    milestoneChipText: { fontSize: 12, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 5,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
    },
    photoWrapper: {
        position: 'relative',
        width: 80,
        height: 80,
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removePhotoButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: staticColors.error,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoButton: {
        width: 80,
        height: 80,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
