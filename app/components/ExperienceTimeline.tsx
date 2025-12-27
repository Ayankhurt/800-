import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Clock,
  Milestone,
  Briefcase,
  GraduationCap,
  Award as AwardIcon,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { ExperienceEntry } from "@/types";

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

interface ExperienceTimelineProps {
  timeline: ExperienceEntry[];
}

const iconMap = {
  milestone: Milestone,
  project: Briefcase,
  certification: GraduationCap,
  award: AwardIcon,
};

export default function ExperienceTimeline({
  timeline,
}: ExperienceTimelineProps) {
  const { colors } = useAuth();

  const colorMap = {
    milestone: colors.primary,
    project: colors.info,
    certification: colors.success,
    award: colors.warning,
  };

  if (!timeline || timeline.length === 0) {
    return null;
  }

  const sortedTimeline = [...timeline].sort((a, b) =>
    b.year.localeCompare(a.year)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Clock size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Experience Timeline
        </Text>
      </View>

      <View style={styles.timeline}>
        {sortedTimeline.map((entry, index) => {
          const Icon = iconMap[entry.type];
          const color = colorMap[entry.type];
          const isLast = index === sortedTimeline.length - 1;

          return (
            <View key={entry.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <Text style={[styles.year, { color: colors.primary }]}>
                  {entry.year}
                </Text>
              </View>

              <View style={styles.timelineCenter}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: color + "20",
                      borderColor: colors.surface,
                    },
                  ]}
                >
                  <Icon size={16} color={color} />
                </View>
                {!isLast && (
                  <View
                    style={[styles.line, { backgroundColor: colors.border }]}
                  />
                )}
              </View>

              <View style={styles.timelineRight}>
                <View
                  style={[
                    styles.entryCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: color + "15" },
                    ]}
                  >
                    <Text style={[styles.typeText, { color }]}>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.entryTitle, { color: colors.text }]}>
                    {entry.title}
                  </Text>
                  <Text
                    style={[
                      styles.entryDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {entry.description}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
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
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row" as const,
    marginBottom: 0,
  },
  timelineLeft: {
    width: 60,
    paddingTop: 4,
  },
  year: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  timelineCenter: {
    alignItems: "center" as const,
    marginHorizontal: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
  },
  entryCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  typeBadge: {
    alignSelf: "flex-start" as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
