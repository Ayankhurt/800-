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
  Alert,
  useWindowDimensions,
} from "react-native";
import { scale, verticalScale, moderateScale, getResponsiveDimensions, fontSize, spacing } from "@/utils/responsive";

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const dimensions = getResponsiveDimensions();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setError("");

    // Validation
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
        // Navigation is handled by AuthContext after successful login
        // No need to navigate here as navigateByRole is called in login function
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
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
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LogIn size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Welcome to BidRoom</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your construction projects
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
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
                style={styles.input}
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
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/register" as any)}
              disabled={isSubmitting}
            >
              <Text style={styles.registerButtonText}>
                Don't have an account? <Text style={styles.registerButtonTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
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
    padding: spacing.xl,
    justifyContent: "center",
    maxWidth: 500, // Limit max width on tablets
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
    marginBottom: verticalScale(40),
  },
  iconContainer: {
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: fontSize["3xl"],
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  form: {
    gap: spacing.lg,
    width: "100%",
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: moderateScale(12),
    padding: spacing.base,
    fontSize: fontSize.md,
    color: Colors.text,
    minHeight: moderateScale(50),
  },
  errorBanner: {
    backgroundColor: Colors.error + "10",
    borderWidth: 1,
    borderColor: Colors.error + "30",
    borderRadius: moderateScale(12),
    padding: spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: fontSize.base,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(12),
    padding: spacing.base,
    alignItems: "center",
    marginTop: spacing.sm,
    minHeight: moderateScale(50),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: fontSize.md,
    fontWeight: "700" as const,
  },
  registerButton: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  registerButtonText: {
    color: Colors.textSecondary,
    fontSize: fontSize.base,
  },
  registerButtonTextBold: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: fontSize.base,
    fontWeight: "600" as const,
  },
});
