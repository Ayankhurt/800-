
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { Shield, Check, Edit2, Plus, Users } from "lucide-react-native";
import { adminAPI } from "@/services/api";

export default function AdminRoles() {
    const { colors } = useAuth();
    const [counts, setCounts] = React.useState({
        admin: 0,
        homeowner: 0,
        contractor: 0,
        support: 0
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Fetch counts for each role group
                // 1. Admins
                const adminsRes = await adminAPI.getAllUsers(1, 1, { role: 'admin' });

                // 2. Homeowners (Viewers/Clients)
                const viewersRes = await adminAPI.getAllUsers(1, 1, { role: 'viewer' });

                // 3. Contractors (Group key roles)
                // We'll just sum up common contractor roles for this display
                const gcRes = await adminAPI.getAllUsers(1, 1, { role: 'general_contractor' });
                const pmRes = await adminAPI.getAllUsers(1, 1, { role: 'project_manager' });
                const subRes = await adminAPI.getAllUsers(1, 1, { role: 'subcontractor' });
                const tsRes = await adminAPI.getAllUsers(1, 1, { role: 'trade_specialist' });

                const totalContractors = (gcRes?.total || 0) + (pmRes?.total || 0) + (subRes?.total || 0) + (tsRes?.total || 0);

                // 4. Support
                const supportRes = await adminAPI.getAllUsers(1, 1, { role: 'support_agent' });

                setCounts({
                    admin: adminsRes?.total || 0,
                    homeowner: viewersRes?.total || 0,
                    contractor: totalContractors,
                    support: supportRes?.total || 0
                });
            } catch (error) {
                console.error("Failed to fetch role counts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();
    }, []);

    const roles = [
        {
            id: "admin",
            name: "Administrator",
            description: "Full system access and configuration control",
            users: counts.admin,
            isSystem: true,
            role_code: "admin"
        },
        {
            id: "homeowner",
            name: "Homeowner / Viewer",
            description: "Can post jobs, hire contractors, and make payments",
            users: counts.homeowner,
            isSystem: true,
            role_code: "viewer"
        },
        {
            id: "contractor",
            name: "Contractor",
            description: "Can bid on jobs, manage projects, and receive payouts",
            users: counts.contractor,
            isSystem: true,
            role_code: "general_contractor"
        },
        {
            id: "support",
            name: "Support Agent",
            description: "Can view tickets and basic user data",
            users: counts.support,
            isSystem: false,
            role_code: "support_agent"
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerTitle: "Roles & Permissions", headerShown: true }} />

            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Manage access levels and permissions for system users.
                </Text>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addButtonText}>Create Role</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={roles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                                <Shield size={24} color={colors.primary} />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={[styles.roleName, { color: colors.text }]}>{item.name}</Text>
                                {item.isSystem && (
                                    <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}>
                                        <Text style={[styles.badgeText, { color: colors.secondary }]}>System Default</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {item.description}
                        </Text>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.footer}>
                            <View style={styles.meta}>
                                <Users size={16} color={colors.textTertiary} />
                                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                                    {loading ? "..." : item.users.toLocaleString()} Users
                                </Text>
                            </View>

                            <TouchableOpacity style={[styles.editButton, { borderColor: colors.border }]}>
                                <Edit2 size={14} color={colors.text} />
                                <Text style={[styles.editButtonText, { color: colors.text }]}>Edit Permissions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        gap: 16,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    listContent: {
        padding: 20,
        gap: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    headerText: {
        flex: 1,
        justifyContent: "center",
    },
    roleName: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "600",
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 13,
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        gap: 6,
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: "500",
    },
});
