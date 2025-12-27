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
import { LogIn } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

// Simple SVG-like icon components for Google and GitHub
const GoogleIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 12 }}>
    <Text style={{ fontSize: 18 }}>G</Text>
  </View>
);

const GitHubIcon = () => (
  <View style={{ width: 20, height: 20, marginRight: 12, backgroundColor: '#24292E', borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 14, color: '#FFF' }}>⚫</Text>
  </View>
);

import { authAPI } from "@/services/api";
export default function LoginScreen() {
  const { login, loginWithOAuth, loading, isAuthenticated, colors } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showMFA, setShowMFA] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setError("");

    if (showMFA) {
      if (!mfaCode || mfaCode.length < 6) {
        setError("Please enter a valid 6-digit code");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      if (!validateEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Pass mfaCode if we are in MFA mode
      const result = await login(email, password, showMFA ? mfaCode : undefined);

      if (result.success) {
        // Navigation handled by AuthContext
      } else if (result.requiresMFA) {
        setShowMFA(true);
        setError("");
        // Keep loading false to allow UI update? No, js runs.
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsSubmitting(true);
    setError("");

    try {
      console.log(`[Social Login] Initiating ${provider} OAuth...`);
      const result = await loginWithOAuth(provider);

      if (!result.success) {
        setError(result.error || `${provider} login failed. Please configure OAuth in Supabase.`);
      }
      // On success, OAuth will redirect automatically
    } catch (err: any) {
      setError(err.message || `Failed to login with ${provider}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert("Email Required", "Please enter your valid email address in the email field first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authAPI.forgotPassword(email);
      if (response.success) {
        Alert.alert("Success", "Password reset link has been sent to your email.");
      } else {
        Alert.alert("Error", response.message || "Failed to send reset link.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "15" }]}>
              <LogIn size={36} color={colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to BidRoom</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to manage your construction projects
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {!showMFA ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                        error && (email === "" || !validateEmail(email)) && [styles.inputError, { borderColor: colors.error }]
                      ]}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.textTertiary}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError("");
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!isSubmitting}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                        error && password === "" && [styles.inputError, { borderColor: colors.error }]
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textTertiary}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError("");
                      }}
                      secureTextEntry
                      autoComplete="password"
                      editable={!isSubmitting}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Two-Factor Authentication Code</Text>
                  <Text style={[styles.mfaInstruction, { color: colors.textSecondary }]}>
                    Enter the 6-digit code from your authenticator app or use one of your backup recovery codes.
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                      error && mfaCode === "" && [styles.inputError, { borderColor: colors.error }]
                    ]}
                    placeholder="000000"
                    placeholderTextColor={colors.textTertiary}
                    value={mfaCode}
                    onChangeText={(text) => {
                      setMfaCode(text);
                      setError("");
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isSubmitting}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setShowMFA(false);
                      setMfaCode("");
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: colors.primary }, isSubmitting && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={[styles.loginButtonText, { color: colors.white }]}>
                    {showMFA ? "Verify & Sign In" : "Sign In"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleSocialLogin('google')}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <View style={styles.socialButtonContent}>
                  <View style={styles.googleIconContainer}>
                    <Text style={[styles.googleIcon, { color: "#4285F4" }]}>G</Text>
                  </View>
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
                </View>
              </TouchableOpacity>

              {/* GitHub Button */}
              <TouchableOpacity
                style={styles.githubButton}
                onPress={() => handleSocialLogin('github')}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <View style={styles.socialButtonContent}>
                  <View style={styles.githubIconContainer}>
                    <LogIn size={18} color="#FFF" />
                  </View>
                  <Text style={styles.githubButtonText}>Continue with GitHub</Text>
                </View>
              </TouchableOpacity>

              {/* Apple - Coming Soon */}
              <View style={[styles.appleButtonDisabled, { backgroundColor: colors.border + "20", borderColor: colors.border }]}>
                <Text style={[styles.appleButtonText, { color: colors.textTertiary }]}>
                  Apple - Coming Soon
                </Text>
              </View>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.push("/register" as any)}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={[styles.registerButtonText, { color: colors.textSecondary }]}>
                  Don't have an account?{" "}
                  <Text style={[styles.registerButtonTextBold, { color: colors.primary }]}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    flexGrow: 1,
    padding: 24,
    paddingVertical: 40,
    justifyContent: "center",
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticColors.background,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: staticColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: staticColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 4px 12px rgba(66, 133, 244, 0.2)",
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: staticColors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  form: {
    gap: 16,
    width: "100%",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: staticColors.background,
    borderWidth: 1.5,
    borderColor: staticColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: staticColors.text,
    minHeight: 50,
  },
  inputError: {
    borderColor: staticColors.error,
    borderWidth: 1.5,
  },
  errorBanner: {
    backgroundColor: staticColors.error + "15",
    borderWidth: 1,
    borderColor: staticColors.error + "40",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: staticColors.error,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  loginButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    minHeight: 50,
    ...Platform.select({
      ios: {
        shadowColor: staticColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0 4px 12px rgba(66, 133, 244, 0.3)",
        cursor: "pointer",
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: staticColors.white,
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: staticColors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: staticColors.textSecondary,
    fontSize: 13,
    fontWeight: "500" as const,
  },
  // Google Button
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 52,
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  socialButtonContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  googleIconContainer: {
    width: 22,
    height: 22,
    marginRight: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#4285F4",
  },
  googleButtonText: {
    color: "#3C4043",
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: 0.25,
  },
  // GitHub Button
  githubButton: {
    backgroundColor: "#24292E",
    borderWidth: 2,
    borderColor: "#24292E",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 52,
    ...Platform.select({
      web: {
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  githubIconContainer: {
    width: 22,
    height: 22,
    marginRight: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  githubButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: 0.25,
  },
  // Apple - Disabled
  appleButtonDisabled: {
    backgroundColor: staticColors.border + "20",
    borderWidth: 2,
    borderColor: staticColors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
    minHeight: 52,
    opacity: 0.6,
  },
  appleButtonText: {
    color: staticColors.textTertiary,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  footer: {
    gap: 12,
    marginTop: 20,
    alignItems: "center",
  },
  registerButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  registerButtonText: {
    color: staticColors.textSecondary,
    fontSize: 14,
  },
  registerButtonTextBold: {
    color: staticColors.primary,
    fontWeight: "700" as const,
  },
  forgotPassword: {
    alignItems: "center",
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: staticColors.primary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  mfaInstruction: {
    fontSize: 13,
    color: staticColors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: staticColors.textSecondary,
    fontSize: 14,
    fontWeight: "500" as const,
  },
});
