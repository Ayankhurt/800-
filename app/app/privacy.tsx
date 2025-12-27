import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { Shield, Eye, Database, Trash2, Download, Lock } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { authAPI } from "@/services/api";

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

interface PrivacyItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
  colors: any;
}

function PrivacyItem({ icon, label, description, onPress, destructive, colors }: PrivacyItemProps) {
  return (
    <TouchableOpacity style={[styles.privacyItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.privacyLeft}>
        <View style={styles.privacyIcon}>{icon}</View>
        <View style={styles.privacyContent}>
          <Text style={[styles.privacyLabel, { color: destructive ? colors.error : colors.text }]}>
            {label}
          </Text>
          <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface PrivacySectionProps {
  title: string;
  children: React.ReactNode;
  colors: any;
}

function PrivacySection({ title, children, colors }: PrivacySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

export default function PrivacyScreen() {
  const { colors } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    try {
      setIsChangingPassword(true);
      console.log("[API] POST /auth/change-password");
      const response = await authAPI.changePassword(oldPassword, newPassword);

      if (response.success) {
        Alert.alert("Success", "Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
      } else {
        Alert.alert("Error", response.message || "Failed to change password");
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDataAccess = () => {
    Alert.alert(
      "Data Access",
      "You can view and manage what data we collect about you.",
      [{ text: "OK" }]
    );
  };

  const handlePermissions = () => {
    Alert.alert(
      "App Permissions",
      "Manage app permissions for camera, location, and notifications.",
      [{ text: "OK" }]
    );
  };

  const handleDownloadData = () => {
    Alert.alert(
      "Download Your Data",
      "Request a copy of all your data. We'll email you a link when it's ready.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Request", onPress: () => Alert.alert("Success", "Data export requested. You'll receive an email when ready.") }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => Alert.alert("Notice", "Account deletion is not available in this demo version.")
        }
      ]
    );
  };

  const handleDataRetention = () => {
    Alert.alert(
      "Data Retention",
      "Learn about how long we keep your data and why.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Privacy & Security",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
          headerTintColor: colors.primary,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Shield size={48} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Your Privacy Matters</Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            We take your privacy seriously and give you control over your data.
          </Text>
        </View>

        <PrivacySection title="Data Management" colors={colors}>
          <PrivacyItem
            icon={<Eye size={20} color={colors.primary} />}
            label="View My Data"
            description="See what information we have about you"
            onPress={handleDataAccess}
            colors={colors}
          />
          <PrivacyItem
            icon={<Download size={20} color={colors.primary} />}
            label="Download My Data"
            description="Get a copy of all your data"
            onPress={handleDownloadData}
            colors={colors}
          />
          <PrivacyItem
            icon={<Database size={20} color={colors.textSecondary} />}
            label="Data Retention Policy"
            description="Learn how long we keep your data"
            onPress={handleDataRetention}
            colors={colors}
          />
        </PrivacySection>

        <PrivacySection title="Security" colors={colors}>
          <PrivacyItem
            icon={<Lock size={20} color={colors.primary} />}
            label="Change Password"
            description="Update your account password"
            onPress={() => setShowChangePassword(!showChangePassword)}
            colors={colors}
          />
        </PrivacySection>

        {showChangePassword && (
          <View style={[styles.passwordForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Change Password</Text>

            <Text style={[styles.label, { color: colors.text }]}>Old Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter current password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter new password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.submitButton, isChangingPassword && styles.submitButtonDisabled, { backgroundColor: colors.primary }]}
              onPress={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.submitButtonText, { color: colors.white }]}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <PrivacySection title="Permissions" colors={colors}>
          <PrivacyItem
            icon={<Shield size={20} color={colors.textSecondary} />}
            label="App Permissions"
            description="Manage camera, location, and notification access"
            onPress={handlePermissions}
            colors={colors}
          />
        </PrivacySection>

        <PrivacySection title="Account" colors={colors}>
          <PrivacyItem
            icon={<Trash2 size={20} color={colors.error} />}
            label="Delete My Account"
            description="Permanently delete your account and data"
            onPress={handleDeleteAccount}
            destructive
            colors={colors}
          />
        </PrivacySection>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            For more information, please read our Privacy Policy and Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 22,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: staticColors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: staticColors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: staticColors.border,
  },
  privacyItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  privacyLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  privacyIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  privacyContent: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    color: staticColors.text,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 13,
    color: staticColors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 13,
    color: staticColors.textTertiary,
    textAlign: "center" as const,
    lineHeight: 20,
  },
  passwordForm: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: staticColors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: staticColors.text,
    borderWidth: 1,
    borderColor: staticColors.border,
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center" as const,
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
});
