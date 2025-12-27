import { useAuth } from '@/contexts/AuthContext';

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
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { jobsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { ArrowLeft, Briefcase } from 'lucide-react-native';

export default function CreateJobScreen() {
    const router = useRouter();
    const { user, colors } = useAuth();
    const toast = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        budget: '',
        timeline: '',
        requirements: '',
    });

    const [errors, setErrors] = useState({
        title: '',
        description: '',
        location: '',
        budget: '',
        timeline: '',
    });

    const validateForm = (): boolean => {
        const newErrors = {
            title: '',
            description: '',
            location: '',
            budget: '',
            timeline: '',
        };

        let isValid = true;

        if (!formData.title.trim()) {
            newErrors.title = 'Job title is required';
            isValid = false;
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
            isValid = false;
        } else if (formData.description.trim().length < 20) {
            newErrors.description = 'Description must be at least 20 characters';
            isValid = false;
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
            isValid = false;
        }

        if (!formData.budget.trim()) {
            newErrors.budget = 'Budget is required';
            isValid = false;
        }

        if (!formData.timeline.trim()) {
            newErrors.timeline = 'Timeline is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            console.log('[CreateJob] Submitting job:', formData);

            const response = await jobsAPI.create({
                title: formData.title.trim(),
                description: formData.description.trim(),
                location: formData.location.trim(),
                budget: formData.budget.trim(),
                deadline: formData.timeline.trim(),
                requirements: formData.requirements.trim() || undefined,
            });

            if (response.success) {
                toast.success('Job created successfully!');
                console.log('[CreateJob] Job created:', response.data);

                // Navigate back to jobs list after a short delay
                setTimeout(() => {
                    router.back();
                }, 1000);
            } else {
                toast.error(response.message || 'Failed to create job');
            }
        } catch (error: any) {
            console.error('[CreateJob] Error:', error);

            if (error.message?.includes('Network Error') || error.message?.includes('connect')) {
                toast.error('No internet connection. Please try again.');
            } else if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
            } else if (error.response?.status === 403) {
                toast.error('You do not have permission to create jobs');
            } else {
                toast.error(error.response?.data?.message || 'Failed to create job. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Create Job',
                    headerStyle: {
                        backgroundColor: colors.surface,
                    },
                    headerTitleStyle: {
                        color: colors.text,
                        fontWeight: '700',
                    },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Briefcase size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.headerTitle}>Post a New Job</Text>
                    <Text style={styles.headerSubtitle}>
                        Fill in the details below to create a new job listing
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* Job Title */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Job Title <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, errors.title && styles.inputError]}
                            placeholder="e.g., Office Renovation"
                            placeholderTextColor={colors.textTertiary}
                            value={formData.title}
                            onChangeText={(value) => handleInputChange('title', value)}
                            editable={!isSubmitting}
                        />
                        {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Description <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.textArea, errors.description && styles.inputError]}
                            placeholder="Describe the job in detail..."
                            placeholderTextColor={colors.textTertiary}
                            value={formData.description}
                            onChangeText={(value) => handleInputChange('description', value)}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            editable={!isSubmitting}
                        />
                        <Text style={styles.charCount}>{formData.description.length} characters</Text>
                        {errors.description ? (
                            <Text style={styles.errorText}>{errors.description}</Text>
                        ) : null}
                    </View>

                    {/* Location */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Location <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, errors.location && styles.inputError]}
                            placeholder="e.g., New York, NY"
                            placeholderTextColor={colors.textTertiary}
                            value={formData.location}
                            onChangeText={(value) => handleInputChange('location', value)}
                            editable={!isSubmitting}
                        />
                        {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
                    </View>

                    {/* Budget */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Budget <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, errors.budget && styles.inputError]}
                            placeholder="e.g., $50,000 - $75,000"
                            placeholderTextColor={colors.textTertiary}
                            value={formData.budget}
                            onChangeText={(value) => handleInputChange('budget', value)}
                            keyboardType="default"
                            editable={!isSubmitting}
                        />
                        {errors.budget ? <Text style={styles.errorText}>{errors.budget}</Text> : null}
                    </View>

                    {/* Timeline */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>
                            Timeline <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, errors.timeline && styles.inputError]}
                            placeholder="e.g., 3 months"
                            placeholderTextColor={colors.textTertiary}
                            value={formData.timeline}
                            onChangeText={(value) => handleInputChange('timeline', value)}
                            editable={!isSubmitting}
                        />
                        {errors.timeline ? <Text style={styles.errorText}>{errors.timeline}</Text> : null}
                    </View>

                    {/* Requirements (Optional) */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Requirements (Optional)</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="List any specific requirements or qualifications..."
                            placeholderTextColor={colors.textTertiary}
                            value={formData.requirements}
                            onChangeText={(value) => handleInputChange('requirements', value)}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Create Job</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footNote}>
                        <Text style={styles.required}>*</Text> Required fields
                    </Text>
                </View>
            </ScrollView>

            {/* Toast notifications */}
            {toast.toasts.map((t) => (
                <Toast
                    key={t.id}
                    type={t.type}
                    message={t.message}
                    visible={t.visible}
                    onDismiss={() => toast.dismissToast(t.id)}
                />
            ))}
        </KeyboardAvoidingView>
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
    backButton: {
        padding: 8,
        marginLeft: 8,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        backgroundColor: staticColors.surface,
        borderBottomWidth: 1,
        borderBottomColor: staticColors.border,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: staticColors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: staticColors.text,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: staticColors.textSecondary,
        textAlign: 'center',
    },
    form: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: staticColors.text,
        marginBottom: 8,
    },
    required: {
        color: staticColors.error,
    },
    input: {
        backgroundColor: staticColors.surface,
        borderWidth: 1,
        borderColor: staticColors.border,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: staticColors.text,
    },
    inputError: {
        borderColor: staticColors.error,
        borderWidth: 2,
    },
    textArea: {
        backgroundColor: staticColors.surface,
        borderWidth: 1,
        borderColor: staticColors.border,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: staticColors.text,
        minHeight: 120,
    },
    charCount: {
        fontSize: 12,
        color: staticColors.textTertiary,
        marginTop: 4,
        textAlign: 'right',
    },
    errorText: {
        fontSize: 12,
        color: staticColors.error,
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: staticColors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: staticColors.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    footNote: {
        fontSize: 12,
        color: staticColors.textTertiary,
        marginTop: 16,
        textAlign: 'center',
    },
});
