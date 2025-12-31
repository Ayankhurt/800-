
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { FileText, Search, Filter, Clock } from "lucide-react-native";
import { adminAPI } from "@/services/api";

export default function AdminLogs() {
    const { colors } = useAuth();

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getLogs(0, 50);
            const logsData = response?.data?.logs || response?.logs || [];
            setLogs(Array.isArray(logsData) ? logsData : []);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchLogs();
        setRefreshing(false);
    };

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.action?.toLowerCase().includes(query) ||
            log.user_email?.toLowerCase().includes(query) ||
            log.details?.toLowerCase().includes(query)
        );
    });

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase() || "success";
        return s === "success" ? colors.success : colors.error;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerTitle: "Audit Logs", headerShown: true }} />

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <View style={[styles.searchInput, { backgroundColor: colors.background }]}>
                    <Search size={20} color={colors.textTertiary} />
                    <TextInput
                        placeholder="Search logs..."
                        placeholderTextColor={colors.textTertiary}
                        style={{ color: colors.text, flex: 1 }}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={[styles.filterButton, { borderColor: colors.border }]} onPress={fetchLogs}>
                    <Filter size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredLogs}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", marginTop: 50 }}>
                            <Text style={{ color: colors.textSecondary }}>No logs found</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.logItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.logHeader}>
                                <View style={styles.logTitleRow}>
                                    <FileText size={16} color={colors.primary} />
                                    <Text style={[styles.actionText, { color: colors.text }]}>{item.action}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                        {(item.status || "INFO").toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.logDetails}>
                                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                                    User: <Text style={{ color: colors.text }}>{item.user_email || item.user_id}</Text>
                                </Text>
                                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                                    IP: {item.ip_address || "N/A"}
                                </Text>
                                {item.details && (
                                    <Text style={[styles.detailText, { color: colors.textSecondary, marginTop: 4 }]}>
                                        {item.details}
                                    </Text>
                                )}
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <View style={styles.logFooter}>
                                <Clock size={14} color={colors.textTertiary} />
                                <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{item.created_at ? new Date(item.created_at).toLocaleString() : "Just now"}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: "row",
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee", // Will be overridden by theme if needed? No, uses view background
    },
    searchInput: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 8,
        gap: 8,
    },
    filterButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
    },
    listContent: {
        padding: 20,
        gap: 12,
    },
    logItem: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    logHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    logTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionText: {
        fontSize: 16,
        fontWeight: "600",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "700",
    },
    logDetails: {
        gap: 4,
        marginBottom: 12,
    },
    detailText: {
        fontSize: 14,
    },
    divider: {
        height: 1,
        marginBottom: 8,
    },
    logFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    timestamp: {
        fontSize: 12,
    },
});
