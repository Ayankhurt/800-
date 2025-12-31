
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { Save, Shield, Bell, DollarSign, Database } from "lucide-react-native";

export default function AdminSettings() {
    const { colors } = useAuth();
    const [platformFee, setPlatformFee] = useState("10");
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [autoApproveUser, setAutoApproveUser] = useState(false);

    const handleSave = () => {
        // API call would go here
        Alert.alert("Settings Saved", "System configuration has been updated successfully.");
    };

    const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
        <View style={styles.sectionHeader}>
            <Icon size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerTitle: "System Settings", headerShown: true }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Financial Settings */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <SectionHeader title="Financial Configuration" icon={DollarSign} />

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Platform Fee (%)</Text>
                        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={platformFee}
                                onChangeText={setPlatformFee}
                                keyboardType="numeric"
                            />
                            <Text style={[styles.unit, { color: colors.textTertiary }]}>%</Text>
                        </View>
                        <Text style={[styles.hint, { color: colors.textTertiary }]}>
                            Percentage taken from each transaction.
                        </Text>
                    </View>
                </View>

                {/* System & Security */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <SectionHeader title="System & Security" icon={Shield} />

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={[styles.rowTitle, { color: colors.text }]}>Maintenance Mode</Text>
                            <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                                Disable access for all non-admin users
                            </Text>
                        </View>
                        <Switch
                            value={maintenanceMode}
                            onValueChange={setMaintenanceMode}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={"#fff"}
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={[styles.rowTitle, { color: colors.text }]}>Auto-Approve Users</Text>
                            <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                                Automatically verify new registrations
                            </Text>
                        </View>
                        <Switch
                            value={autoApproveUser}
                            onValueChange={setAutoApproveUser}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={"#fff"}
                        />
                    </View>
                </View>

                {/* Notifications */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <SectionHeader title="Notifications" icon={Bell} />

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={[styles.rowTitle, { color: colors.text }]}>Admin Email Alerts</Text>
                            <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                                Receive emails for critical system events
                            </Text>
                        </View>
                        <Switch
                            value={emailNotifications}
                            onValueChange={setEmailNotifications}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={"#fff"}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                >
                    <Save size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    unit: {
        fontSize: 16,
        fontWeight: "500",
    },
    hint: {
        fontSize: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    rowText: {
        flex: 1,
        paddingRight: 16,
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: "500",
    },
    rowDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 10,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
