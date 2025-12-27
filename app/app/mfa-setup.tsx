import { authAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

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
import { router } from "expo-router";
import { Shield, QrCode, Key, ArrowLeft, CheckCircle, Copy } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Clipboard,
} from "react-native";

export default function MFASetupScreen() {
    const { restoreSession, colors } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [mfaData, setMfaData] = useState<any>(null);
    const [code, setCode] = useState("");
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1); // 1: QR/Setup, 2: Success

    useEffect(() => {
        fetchMFADetails();
    }, []);

    const fetchMFADetails = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await authAPI.setupMFA();
            if (response.success && response.data) {
                setMfaData(response.data);
            } else {
                setError(response.message || "Failed to setup MFA");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) {
            setError("Please enter the 6-digit code");
            return;
        }

        setIsVerifying(true);
        setError("");
        try {
            const response = await authAPI.verifyMFASetup(code);
            if (response.success) {
                if (response.data?.recovery_codes) {
                    setRecoveryCodes(response.data.recovery_codes);
                }
                await restoreSession();
                setStep(2);
            } else {
                setError(response.message || "Invalid code. Please try again.");
            }
        } catch (err: any) {
            setError(err.message || "Verification failed");
        } finally {
            setIsVerifying(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading security settings...</Text>
            </View>
        );
    }

    if (step === 2) {
        return (
            <ScrollView contentContainerStyle={styles.centerContainer} style={{ backgroundColor: colors.background }}>
                <CheckCircle size={80} color={colors.success} strokeWidth={1.5} />
                <Text style={[styles.successTitle, { color: colors.text }]}>2FA Enabled!</Text>
                <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                    Your account is now protected with multi-factor authentication.
                </Text>

                {recoveryCodes.length > 0 && (
                    <View style={[styles.recoveryContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.recoveryHeader}>
                            <Shield size={20} color={colors.primary} />
                            <Text style={[styles.recoveryTitle, { color: colors.text }]}>Recovery Codes</Text>
                        </View>
                        <Text style={[styles.recoveryDescription, { color: colors.textSecondary }]}>
                            Save these codes in a safe place. You can use them to access your account if you lose your phone.
                        </Text>
                        <View style={styles.codesGrid}>
                            {recoveryCodes.map((c, i) => (
                                <View key={i} style={styles.codeItem}>
                                    <Text style={[styles.codeText, { color: colors.text }]}>{c}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.copyAllButton, { borderColor: colors.primary }]}
                            onPress={() => {
                                Clipboard.setString(recoveryCodes.join("\n"));
                                Alert.alert("Success", "All recovery codes copied to clipboard!");
                            }}
                        >
                            <Copy size={16} color={colors.primary} />
                            <Text style={[styles.copyAllText, { color: colors.primary }]}>Copy All Codes</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.doneButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Shield size={48} color={colors.primary} strokeWidth={1.5} />
                        <Text style={[styles.title, { color: colors.text }]}>Secure Your Account</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Follow these steps to enable Two-Factor Authentication (2FA).
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.stepBadgeText}>1</Text>
                            </View>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Scan QR Code</Text>
                        </View>

                        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                            Install an authenticator app (like Google Authenticator or Authy) and scan this code.
                        </Text>

                        {mfaData?.qr_code && (
                            <View style={[styles.qrContainer, { backgroundColor: colors.surfaceAlt }]}>
                                <Image
                                    source={{ uri: mfaData.qr_code }}
                                    style={styles.qrImage}
                                    resizeMode="contain"
                                />
                            </View>
                        )}

                        <View style={[styles.manualEntryContainer, { backgroundColor: colors.primaryLight }]}>
                            <View style={styles.manualEntryHeader}>
                                <Key size={16} color={colors.textSecondary} />
                                <Text style={[styles.manualEntryLabel, { color: colors.textSecondary }]}>Manual entry key:</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.copyKeyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => {
                                    Clipboard.setString(mfaData?.secret);
                                    Alert.alert("Success", "Manual key copied to clipboard!");
                                }}
                            >
                                <Text style={[styles.manualEntryKey, { color: colors.primary }]}>{mfaData?.secret}</Text>
                                <Copy size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={styles.stepHeader}>
                            <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.stepBadgeText}>2</Text>
                            </View>
                            <Text style={[styles.stepTitle, { color: colors.text }]}>Verify Code</Text>
                        </View>

                        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                            Enter the 6-digit verification code from your authenticator app.
                        </Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }, error ? styles.inputError : null]}
                            placeholder="000 000"
                            placeholderTextColor={colors.textTertiary}
                            value={code}
                            onChangeText={(text) => {
                                setCode(text);
                                setError("");
                            }}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!isVerifying}
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.verifyButton, { backgroundColor: colors.primary }, isVerifying ? styles.buttonDisabled : null]}
                            onPress={handleVerify}
                            disabled={isVerifying}
                        >
                            {isVerifying ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.verifyButtonText}>Enable 2FA</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: staticColors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        backgroundColor: staticColors.background,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: staticColors.surface,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
            android: { elevation: 2 },
            web: { cursor: "pointer" }
        }),
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: staticColors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: staticColors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: staticColors.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 4 },
        }),
    },
    stepHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    stepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: staticColors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    stepBadgeText: {
        color: staticColors.white,
        fontSize: 14,
        fontWeight: "700",
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: staticColors.text,
    },
    stepDescription: {
        fontSize: 14,
        color: staticColors.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    qrContainer: {
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    qrImage: {
        width: 200,
        height: 200,
    },
    manualEntryContainer: {
        backgroundColor: staticColors.primaryLight,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    manualEntryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    copyKeyContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: staticColors.white,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: staticColors.border,
    },
    manualEntryLabel: {
        fontSize: 13,
        color: staticColors.textSecondary,
        marginLeft: 6,
    },
    manualEntryKey: {
        fontSize: 14,
        fontWeight: "700",
        color: staticColors.primary,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        flex: 1,
        marginRight: 10,
    },
    input: {
        backgroundColor: staticColors.background,
        borderWidth: 1,
        borderColor: staticColors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 20,
        textAlign: "center",
        fontWeight: "600",
        letterSpacing: 4,
        color: staticColors.text,
    },
    inputError: {
        borderColor: staticColors.error,
    },
    errorText: {
        color: staticColors.error,
        fontSize: 14,
        marginTop: 8,
    },
    verifyButton: {
        backgroundColor: staticColors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 20,
    },
    verifyButtonText: {
        color: staticColors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: staticColors.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: staticColors.textSecondary,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: staticColors.text,
        marginTop: 24,
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 16,
        color: staticColors.textSecondary,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 32,
    },
    doneButton: {
        backgroundColor: staticColors.primary,
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 12,
    },
    doneButtonText: {
        color: staticColors.white,
        fontSize: 16,
        fontWeight: "600",
    },
    recoveryContainer: {
        width: "100%",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
        marginBottom: 32,
    },
    recoveryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    recoveryTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 10,
    },
    recoveryDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    codesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    codeItem: {
        width: "48%",
        backgroundColor: "#F1F5F9",
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: "center",
    },
    codeText: {
        fontSize: 15,
        fontWeight: "600",
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    copyAllButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: "dashed",
    },
    copyAllText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "600",
    },
});
