import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { TrendingUp, Eye, Clock, Target, Award } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";

const staticColors = {
  primary: "#2563EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  white: "#FFFFFF",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
};

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  colors: any;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  colors,
}) => {
  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: color, backgroundColor: colors.surface },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
          {icon}
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
          {subtitle && (
            <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>
              {subtitle}
            </Text>
          )}
          {trend && (
            <View style={styles.trendContainer}>
              <TrendingUp size={14} color={colors.success} />
              <Text style={[styles.trendText, { color: colors.success }]}>
                {trend}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

interface AnalyticsDashboardProps {
  profileViews: number;
  profileViewsTrend?: string;
  responseRate: number;
  averageResponseTime: number;
  conversionRate: number;
  completionScore: number;
  suggestions?: string[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  profileViews,
  profileViewsTrend,
  responseRate,
  averageResponseTime,
  conversionRate,
  completionScore,
  suggestions = [],
}) => {
  const { colors } = useAuth();

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Analytics Overview
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track your profile performance
        </Text>
      </View>

      <View style={styles.grid}>
        <AnalyticsCard
          title="Profile Views"
          value={profileViews.toString()}
          subtitle="Total views"
          trend={profileViewsTrend}
          icon={<Eye size={24} color={colors.primary} />}
          color={colors.primary}
          colors={colors}
        />

        <AnalyticsCard
          title="Response Rate"
          value={`${responseRate}%`}
          subtitle="Of all leads"
          icon={<Target size={24} color={colors.success} />}
          color={colors.success}
          colors={colors}
        />

        <AnalyticsCard
          title="Avg Response Time"
          value={formatResponseTime(averageResponseTime)}
          subtitle="To leads"
          icon={<Clock size={24} color={colors.warning} />}
          color={colors.warning}
          colors={colors}
        />

        <AnalyticsCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtitle="Lead to project"
          icon={<TrendingUp size={24} color={colors.info} />}
          color={colors.info}
          colors={colors}
        />

        <AnalyticsCard
          title="Profile Completion"
          value={`${completionScore}%`}
          subtitle="Complete your profile"
          icon={<Award size={24} color={colors.primary} />}
          color={colors.primary}
          colors={colors}
        />
      </View>

      {suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.warning + "10",
              borderColor: colors.warning + "30",
            },
          ]}
        >
          <Text style={[styles.suggestionsTitle, { color: colors.warning }]}>
            Improve Your Profile
          </Text>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <View
                style={[
                  styles.suggestionBullet,
                  { backgroundColor: colors.warning },
                ]}
              />
              <Text style={[styles.suggestionText, { color: colors.text }]}>
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View
        style={[
          styles.infoContainer,
          {
            backgroundColor: colors.primary + "10",
            borderColor: colors.primary + "30",
          },
        ]}
      >
        <Text style={[styles.infoTitle, { color: colors.primary }]}>
          Tips for Better Performance
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          • Respond to leads within 1 hour for better engagement{"\n"}• Keep
          your profile up to date with recent projects{"\n"}• Add certifications
          to build trust{"\n"}• Maintain 80%+ response rate for top ranking
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  grid: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500" as const,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  suggestionsContainer: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  infoContainer: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
