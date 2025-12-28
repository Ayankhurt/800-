import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { FileText } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
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

export default function TermsScreen() {
  const { colors } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Terms of Service",
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
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <FileText size={48} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            Last updated: January 2025
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            By accessing and using Bidroom, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Use License</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Permission is granted to temporarily access Bidroom for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Modify or copy the materials</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Use the materials for any commercial purpose</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Attempt to decompile or reverse engineer any software</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Remove any copyright or proprietary notations</Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. User Accounts</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. User Content</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Bidding and Contracts</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            When you submit a bid through Bidroom, you agree that:
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• All information provided is accurate and truthful</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• You have the authority to enter into binding contracts</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• You will honor all accepted bids and commitments</Text>
          <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>• Bidroom acts as a platform and is not a party to contracts</Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Payment Terms</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Payment terms are agreed upon between the parties directly. Bidroom may charge platform fees for certain services, which will be clearly disclosed before any transaction.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Intellectual Property</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            The service and its original content, features, and functionality are and will remain the exclusive property of Bidroom and its licensors. The service is protected by copyright, trademark, and other laws.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Termination</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Limitation of Liability</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            In no event shall Bidroom, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>10. Disclaimer</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Your use of the service is at your sole risk. The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. The service is provided without warranties of any kind, whether express or implied.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>11. Governing Law</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>12. Changes to Terms</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days&apos; notice prior to any new terms taking effect.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>13. Contact Us</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            If you have any questions about these Terms, please contact us at:
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Email: legal@bidroom.com{"\n"}
            Phone: 1-800-BIDROOM
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            © 2025 Bidroom. All rights reserved.
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
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: staticColors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 15,
    color: staticColors.textSecondary,
    lineHeight: 24,
    marginLeft: 16,
    marginBottom: 8,
  },
  footer: {
    alignItems: "center" as const,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
  },
  footerText: {
    fontSize: 13,
    color: staticColors.textTertiary,
    textAlign: "center" as const,
  },
});
