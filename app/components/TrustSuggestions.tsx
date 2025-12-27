import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Contractor } from "@/types";
import { generateTrustSuggestions, calculateTrustScore } from "@/utils/trust";

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

interface TrustSuggestionsProps {
  contractor: Contractor;
}

export default function TrustSuggestions({
  contractor,
}: TrustSuggestionsProps) {
  const { colors } = useAuth();
  const suggestions = generateTrustSuggestions(contractor);
  const trustScore = calculateTrustScore(contractor);

  const getSuggestionIcon = (suggestion: string) => {
    if (
      suggestion.toLowerCase().includes("request") ||
      suggestion.toLowerCase().includes("confirm") ||
      suggestion.toLowerCase().includes("consider")
    ) {
      return <AlertTriangle size={16} color={colors.warning} />;
    }
    if (
      suggestion.toLowerCase().includes("top rated") ||
      suggestion.toLowerCase().includes("excellent") ||
      suggestion.toLowerCase().includes("highly")
    ) {
      return <CheckCircle size={16} color={colors.success} />;
    }
    return <Info size={16} color={colors.info} />;
  };

  const getSuggestionColor = (suggestion: string): string => {
    if (
      suggestion.toLowerCase().includes("request") ||
      suggestion.toLowerCase().includes("confirm") ||
      suggestion.toLowerCase().includes("consider")
    ) {
      return colors.warning + "15";
    }
    if (
      suggestion.toLowerCase().includes("top rated") ||
      suggestion.toLowerCase().includes("excellent") ||
      suggestion.toLowerCase().includes("highly")
    ) {
      return colors.success + "15";
    }
    return colors.info + "15";
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Lightbulb size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Trust Insights
        </Text>
      </View>

      <View style={styles.suggestionsContainer}>
        {suggestions.map((suggestion, index) => (
          <View
            key={index}
            style={[
              styles.suggestionItem,
              { backgroundColor: getSuggestionColor(suggestion) },
            ]}
          >
            <View style={styles.suggestionIcon}>
              {getSuggestionIcon(suggestion)}
            </View>
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {suggestion}
            </Text>
          </View>
        ))}
      </View>

      {trustScore.score < 70 && (
        <View
          style={[
            styles.warningBox,
            {
              backgroundColor: colors.warning + "10",
              borderColor: colors.warning + "30",
            },
          ]}
        >
          <AlertTriangle size={18} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.text }]}>
            This contractor has a trust score below 70%. We recommend extra due
            diligence before hiring.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginBottom: 1,
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
  suggestionsContainer: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: "row" as const,
    padding: 14,
    borderRadius: 10,
    gap: 12,
    alignItems: "flex-start" as const,
  },
  suggestionIcon: {
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: "row" as const,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    gap: 12,
    alignItems: "flex-start" as const,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const,
  },
});
