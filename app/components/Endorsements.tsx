import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Users, Quote } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Endorsement } from "@/types";

const staticColors = {
  primary: "#2563EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  white: "#FFFFFF",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
};

interface EndorsementsProps {
  endorsements: Endorsement[];
}

const relationshipLabels: Record<string, string> = {
  client: "Client",
  colleague: "Colleague",
  supervisor: "Supervisor",
  subcontractor: "Subcontractor",
};

export default function Endorsements({ endorsements }: EndorsementsProps) {
  const { colors } = useAuth();

  if (!endorsements || endorsements.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Endorsements</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {endorsements.length}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {endorsements.map((endorsement) => (
          <View
            key={endorsement.id}
            style={[
              styles.endorsementCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.quoteIcon}>
              <Quote size={16} color={colors.primary} />
            </View>

            <Text style={[styles.skill, { color: colors.text }]}>
              {endorsement.skill}
            </Text>
            <Text
              style={[styles.comment, { color: colors.textSecondary }]}
              numberOfLines={4}
            >
              {endorsement.comment}
            </Text>

            <View style={styles.footer}>
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: colors.text }]}>
                  {endorsement.fromName}
                </Text>
                <Text
                  style={[
                    styles.authorCompany,
                    { color: colors.textSecondary },
                  ]}
                >
                  {endorsement.fromCompany}
                </Text>
              </View>
              <View
                style={[
                  styles.relationshipBadge,
                  { backgroundColor: colors.info + "15" },
                ]}
              >
                <Text style={[styles.relationshipText, { color: colors.info }]}>
                  {relationshipLabels[endorsement.relationship] ||
                    endorsement.relationship}
                </Text>
              </View>
            </View>

            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {new Date(endorsement.date).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  endorsementCard: {
    width: 280,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  quoteIcon: {
    marginBottom: 8,
  },
  skill: {
    fontSize: 15,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  comment: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 8,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  authorCompany: {
    fontSize: 11,
  },
  relationshipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  relationshipText: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  date: {
    fontSize: 11,
  },
});
