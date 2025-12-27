import { Link, Stack } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

const staticColors = {
  primary: "#2563EB",
  error: "#EF4444",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
};

export default function NotFoundScreen() {
  const { colors } = useAuth();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AlertCircle size={64} color={colors.error} />
        <Text style={[styles.title, { color: colors.text }]}>Page Not Found</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          The page you&apos;re looking for doesn&apos;t exist.
        </Text>
        <Link href="/" style={[styles.link, { backgroundColor: colors.primary }]}>
          <Text style={[styles.linkText, { color: colors.surface }]}>
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center" as const,
    marginBottom: 24,
  },
  link: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
