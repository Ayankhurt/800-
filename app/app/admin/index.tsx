
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import {
    Users,
    Briefcase,
    DollarSign,
    AlertTriangle,
    Bell,
    Shield,
    Settings,
    FileText,
    ChevronRight,
    LayoutDashboard
} from "lucide-react-native";

export default function AdminDashboard() {
    const { colors, user } = useAuth();
    const router = useRouter();

    const features = [
        {
            id: "users",
            title: "User Management",
            description: "Manage users, verification status, and profiles",
            icon: Users,
            route: "/admin/user-management",
            color: "#3B82F6", // Blue
        },
        {
            id: "projects",
            title: "Projects & Jobs",
            description: "Oversee job listings, bids, and active projects",
            icon: Briefcase,
            route: "/admin/projects",
            color: "#10B981", // Green
        },
        {
            id: "finance",
            title: "Financials",
            description: "Monitor transactions, escrow, and payouts",
            icon: DollarSign,
            route: "/admin/finance",
            color: "#F59E0B", // Amber
        },
        {
            id: "disputes",
            title: "Dispute Resolution",
            description: "Handle conflicts between clients and contractors",
            icon: AlertTriangle,
            route: "/admin/disputes",
            color: "#EF4444", // Red
        },
        {
            id: "notifications",
            title: "Notifications",
            description: "Manage system alerts and announcements",
            icon: Bell,
            route: "/admin/notifications",
            color: "#8B5CF6", // Purple
        },
        {
            id: "roles",
            title: "Roles & Permissions",
            description: "Configure admin access and capabilities",
            icon: Shield,
            route: "/admin/roles",
            color: "#6366F1", // Indigo
        },
        {
            id: "settings",
            title: "System Settings",
            description: "Platform fee configuration and general settings",
            icon: Settings,
            route: "/admin/settings",
            color: "#64748B", // Slate
        },
        {
            id: "logs",
            title: "Activity Logs",
            description: "Audit trail of system activities",
            icon: FileText,
            route: "/admin/logs",
            color: "#0EA5E9", // Sky
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
                        <Text style={[styles.title, { color: colors.text }]}>{user?.name || "Admin"}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                        <LayoutDashboard size={16} color={colors.primary} />
                        <Text style={[styles.badgeText, { color: colors.primary }]}>Dashboard</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview & Tools</Text>

                <View style={styles.grid}>
                    {features.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border
                                }
                            ]}
                            onPress={() => router.push(feature.route as any)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: feature.color + '15' }]}>
                                <feature.icon size={24} color={feature.color} />
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>{feature.title}</Text>
                                <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {feature.description}
                                </Text>
                            </View>

                            <ChevronRight size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60, // Safe area
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    greeting: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
    },
    grid: {
        gap: 16,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
});
