import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { LogIn } from "lucide-react-native";
import React, { useState } from "react";
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

export default function LoginScreen() {
  const { login, loginWithOAuth, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Navigation handled by AuthContext
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <View style={styles.iconContainer}>
              <LogIn size={36} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>Welcome to BidRoom</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your construction projects
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    error && (email === "" || !validateEmail(email)) && styles.inputError
                  ]}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textTertiary}
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
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    error && password === "" && styles.inputError
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textTertiary}
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

              <TouchableOpacity
                style={[styles.loginButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => handleSocialLogin('google')}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <View style={styles.socialButtonContent}>
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
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
              <View style={styles.appleButtonDisabled}>
                <Text style={styles.appleButtonText}>
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
                <Text style={styles.registerButtonText}>
                  Don't have an account?{" "}
                  <Text style={styles.registerButtonTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
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
    color: Colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: Colors.surface,
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
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    minHeight: 50,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  errorBanner: {
    backgroundColor: Colors.error + "15",
    borderWidth: 1,
    borderColor: Colors.error + "40",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500" as const,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    minHeight: 50,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
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
    color: Colors.white,
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
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.border + "20",
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
    minHeight: 52,
    opacity: 0.6,
  },
  appleButtonText: {
    color: Colors.textTertiary,
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
    color: Colors.textSecondary,
    fontSize: 14,
  },
  registerButtonTextBold: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  forgotPassword: {
    alignItems: "center",
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
