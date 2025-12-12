import { Stack , useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Colors from "@/constants/colors";
import { AlertCircle } from "lucide-react-native";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Role security - redirect non-admin users
  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN") {
      router.replace("/(tabs)");
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Block non-admin access
  if (user && user.role !== "ADMIN") {
    return (
      <View style={styles.container}>
        <AlertCircle size={48} color={Colors.error} />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>Only Admin users can access this area.</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="user-management" options={{ headerShown: false }} />
      <Stack.Screen name="projects" options={{ headerShown: false }} />
      <Stack.Screen name="disputes" options={{ headerShown: false }} />
      <Stack.Screen name="finance" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.error,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});

