import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function ReferralsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: true, title: "Referrals" }} />
            <View style={styles.content}>
                <Text style={styles.title}>Referrals</Text>
                <Text style={styles.message}>This feature is coming soon.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
        color: Colors.text,
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: "center",
    },
});
