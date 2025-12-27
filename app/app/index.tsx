import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";

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

export default function IndexScreen() {
  const { user, loading, hydrationComplete, isAuthenticated, colors } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Handle initial navigation based on auth state
  useEffect(() => {
    // Wait for hydration to complete
    if (!hydrationComplete || loading) {
      return;
    }

    // If authenticated, redirect to main app
    if (isAuthenticated) {
      console.log(`[IndexScreen] User authenticated, redirecting to tabs`);
      setTimeout(() => {
        try {
          router.replace("/(tabs)");
        } catch (error) {
          console.warn("[IndexScreen] Navigation to tabs failed:", error);
          try {
            router.push("/(tabs)");
          } catch (e) { console.error("Nav failed completely", e); }
        }
      }, 100);
      return;
    }

    // If user is not authenticated and not already on login/register, redirect to login
    if (!isAuthenticated && !user) {
      const currentRoute = segments[0];
      if (currentRoute !== "login" && currentRoute !== "register") {
        console.log(`[IndexScreen] User not authenticated, redirecting to login`);
        // Use a small delay to ensure navigator is ready
        setTimeout(() => {
          try {
            router.replace("/login");
          } catch (error) {
            console.warn("[IndexScreen] Navigation to login failed:", error);
            // Fallback: try push
            try {
              router.push("/login");
            } catch (pushError) {
              console.error("[IndexScreen] Push to login also failed:", pushError);
            }
          }
        }, 100);
      }
    }
  }, [isAuthenticated, user, loading, hydrationComplete, segments, router]);

  // Show splash while loading or hydration not complete
  if (loading || !hydrationComplete || (user && !user.role)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated && !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null; // Navigation handled by AuthContext and useEffect above
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: staticColors.background,
  },
});

