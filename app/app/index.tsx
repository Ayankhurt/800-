import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import Colors from "@/constants/colors";

export default function IndexScreen() {
  const { user, loading, hydrationComplete, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Handle initial navigation based on auth state
  useEffect(() => {
    // Wait for hydration to complete
    if (!hydrationComplete || loading) {
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated && !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
    backgroundColor: Colors.background,
  },
});

