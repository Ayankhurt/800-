import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { HelpCircle, MessageCircle, Mail, Book, Phone } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
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

interface HelpItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  colors: any;
}

function HelpItem({ icon, label, description, onPress, colors }: HelpItemProps) {
  return (
    <TouchableOpacity style={[styles.helpItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.helpLeft}>
        <View style={styles.helpIcon}>{icon}</View>
        <View style={styles.helpContent}>
          <Text style={[styles.helpLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.helpDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
  colors: any;
}

function FAQItem({ question, answer, colors }: FAQItemProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      style={[styles.faqItem, { borderBottomColor: colors.border }]}
      onPress={() => setExpanded(!expanded)}
    >
      <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
      {expanded && <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const { colors } = useAuth();

  const handleChat = () => {
    Alert.alert(
      "Live Chat",
      "Our support team is available Monday-Friday, 9AM-5PM EST.",
      [{ text: "OK" }]
    );
  };

  const handleEmail = async () => {
    const email = "support@bidroom.com";
    const url = `mailto:${email}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Could not open email client");
    }
  };

  const handlePhone = async () => {
    Alert.alert(
      "Contact Support",
      "Call us at: 1-800-BIDROOM\n(1-800-243-7666)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: async () => {
            try {
              await Linking.openURL("tel:18002437666");
            } catch (error) {
              Alert.alert("Error", "Could not open phone dialer");
            }
          }
        }
      ]
    );
  };

  const handleDocs = () => {
    Alert.alert(
      "Documentation",
      "View our comprehensive guides and tutorials.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Help & Support",
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
          <HelpCircle size={48} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>How can we help?</Text>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>
            Get answers to your questions or reach out to our support team.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Contact Support</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <HelpItem
              icon={<MessageCircle size={20} color={colors.primary} />}
              label="Live Chat"
              description="Chat with our support team in real-time"
              onPress={handleChat}
              colors={colors}
            />
            <HelpItem
              icon={<Mail size={20} color={colors.primary} />}
              label="Email Support"
              description="Send us an email and we'll respond within 24 hours"
              onPress={handleEmail}
              colors={colors}
            />
            <HelpItem
              icon={<Phone size={20} color={colors.primary} />}
              label="Phone Support"
              description="Call us for immediate assistance"
              onPress={handlePhone}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Resources</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <HelpItem
              icon={<Book size={20} color={colors.textSecondary} />}
              label="Documentation"
              description="Browse guides and tutorials"
              onPress={handleDocs}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Frequently Asked Questions</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FAQItem
              question="How do I post a new job?"
              answer="Navigate to the Jobs tab and tap the '+' button in the top right. Fill out the job details and submit."
              colors={colors}
            />
            <FAQItem
              question="How do I submit a bid?"
              answer="Open any job listing and tap 'Submit Bid'. Enter your bid amount, timeline, and any relevant details."
              colors={colors}
            />
            <FAQItem
              question="How do I schedule an appointment?"
              answer="From a job detail page, tap 'Book Appointment' and select a date and time that works for you."
              colors={colors}
            />
            <FAQItem
              question="How do I verify my account?"
              answer="Complete the verification process in your profile settings to gain access to all features."
              colors={colors}
            />
            <FAQItem
              question="Can I edit or delete my bid?"
              answer="Yes, you can edit or withdraw your bid before it's accepted. Go to your Bids tab and select the bid you want to modify."
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Still need help? Our support team is here to assist you.
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
  helpItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  helpLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  helpIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  helpContent: {
    flex: 1,
  },
  helpLabel: {
    fontSize: 16,
    color: staticColors.text,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  helpDescription: {
    fontSize: 13,
    color: staticColors.textSecondary,
    lineHeight: 18,
  },
  faqItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  faqQuestion: {
    fontSize: 16,
    color: staticColors.text,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
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
});
