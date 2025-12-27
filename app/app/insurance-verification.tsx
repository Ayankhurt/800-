import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function InsuranceVerificationScreen() {
    const { colors } = useAuth();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Insurance Verification",
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text
                }}
            />
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>Insurance Verification</Text>
                <Text style={[styles.message, { color: colors.textSecondary }]}>This feature is coming soon.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: staticColors.background,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: staticColors.text,
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: staticColors.textSecondary,
        textAlign: "center",
    },
});
