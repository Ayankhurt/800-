import { Stack, useRouter } from "expo-router";
import { Bell, Palette, Globe, Lock, ShieldCheck, ShieldAlert } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

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

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: boolean;
  statusLabel?: string;
  statusColor?: string;
  loading?: boolean;
  colors: any;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

function SettingItem({ icon, label, description, value, statusLabel, statusColor, loading, colors, onToggle, onPress }: SettingItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={(!onPress && !onToggle) || loading}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <View style={styles.settingContent}>
          <View style={styles.labelRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            {statusLabel && (
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            )}
          </View>
          {description && (
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{description}</Text>
          )}
        </View>
      </View>
      {onToggle && (
        <View>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch
              value={value}
              onValueChange={onToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

interface SettingSectionProps {
  title: string;
  colors: any;
  children: React.ReactNode;
}

function SettingSection({ title, colors, children }: SettingSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, updateUser, colors, isDarkMode: contextIsDarkMode } = useAuth();

  // Initialize state from user settings
  const [pushNotifications, setPushNotifications] = useState(user?.settings?.push_notifications ?? true);
  const [emailNotifications, setEmailNotifications] = useState(user?.settings?.email_notifications ?? true);

  // Use context theme as fallback if user setting is undefined
  const [darkMode, setDarkMode] = useState(user?.settings?.dark_mode ?? contextIsDarkMode);

  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdateSetting = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    try {
      setUpdating(key);
      setter(value);

      const updatedSettings = {
        ...(user?.settings || {}),
        [key]: value
      };

      await userAPI.updateSettings(updatedSettings);

      // Update local context
      if (updateUser) {
        await updateUser({ settings: updatedSettings });
      }
    } catch (error) {
      console.error("Failed to update setting:", error);
      // Revert on error
      setter(!value);
    } finally {
      setUpdating(null);
    }
  };

  const is2FAEnabled = !!user?.two_factor_enabled;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Settings",
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
        <SettingSection title="Notifications" colors={colors}>
          <SettingItem
            icon={<Bell size={20} color={colors.primary} />}
            label="Push Notifications"
            description="Receive push notifications for important updates"
            value={pushNotifications}
            colors={colors}
            loading={updating === 'push_notifications'}
            onToggle={(val) => handleUpdateSetting('push_notifications', val, setPushNotifications)}
          />
          <SettingItem
            icon={<Bell size={20} color={colors.primary} />}
            label="Email Notifications"
            description="Get updates via email"
            value={emailNotifications}
            colors={colors}
            loading={updating === 'email_notifications'}
            onToggle={(val) => handleUpdateSetting('email_notifications', val, setEmailNotifications)}
          />
        </SettingSection>

        <SettingSection title="Appearance" colors={colors}>
          <SettingItem
            icon={<Palette size={20} color={colors.textSecondary} />}
            label="Dark Mode"
            description="Use dark theme"
            value={darkMode}
            colors={colors}
            loading={updating === 'dark_mode'}
            onToggle={(val) => handleUpdateSetting('dark_mode', val, setDarkMode)}
          />
        </SettingSection>

        <SettingSection title="Security" colors={colors}>
          <SettingItem
            icon={is2FAEnabled ? <Lock size={20} color={colors.success} /> : <Lock size={20} color={colors.textSecondary} />}
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            statusLabel={is2FAEnabled ? "Enabled" : "Disabled"}
            statusColor={is2FAEnabled ? colors.success : colors.textTertiary}
            colors={colors}
            onPress={() => router.push("/mfa-setup")}
          />
        </SettingSection>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Settings are saved automatically
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  settingContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 13,
    textAlign: "center" as const,
  },
});
