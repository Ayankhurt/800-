import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image
} from "react-native";
import { Stack, router } from "expo-router";
import { X, Star, MapPin, Briefcase, DollarSign } from "lucide-react-native";
import { Contractor } from "@/types";
import { PromotionalBadges, getBadgesForContractor } from "@/components/PromotionalBadges";
import { useAuth } from "@/contexts/AuthContext";


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

const ComparisonRow: React.FC<{
  label: string;
  values: (string | number | React.ReactNode)[];
  colors: any;
}> = ({ label, values, colors }) => {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={[styles.labelCell, { backgroundColor: colors.background }]}>
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      {values.map((value, index) => (
        <View key={index} style={styles.valueCell}>
          {typeof value === "string" || typeof value === "number" ? (
            <Text style={[styles.valueText, { color: colors.text }]}>{value}</Text>
          ) : (
            value
          )}
        </View>
      ))}
    </View>
  );
};

export default function ContractorComparison() {
  const { colors } = useAuth();
  const [selectedContractors, setSelectedContractors] = useState<Contractor[]>([
    {
      id: "1",
      name: "John Smith",
      company: "Smith Construction",
      trade: "General Contractor",
      location: "Austin, TX",
      rating: 4.8,
      reviewCount: 45,
      phone: "555-0101",
      email: "john@smithconstruction.com",
      verified: true,
      completedProjects: 120,
      yearsInBusiness: 15,
      insuranceAmount: "$2M",
      licenseNumber: "TX-123456",
      specialties: ["Residential", "Commercial", "Renovation"],
      trustIndicators: {
        responseTime: 30,
        responseRate: 95,
        onTimeRate: 92,
        repeatClientRate: 78,
        disputeRate: 2,
      },
      featured: true,
    },
    {
      id: "2",
      name: "Sarah Johnson",
      company: "Johnson Electric",
      trade: "Electrician",
      location: "Austin, TX",
      rating: 4.9,
      reviewCount: 67,
      phone: "555-0102",
      email: "sarah@johnsonelectric.com",
      verified: true,
      completedProjects: 200,
      yearsInBusiness: 12,
      insuranceAmount: "$1.5M",
      licenseNumber: "TX-234567",
      specialties: ["Residential", "Industrial", "Solar"],
      trustIndicators: {
        responseTime: 20,
        responseRate: 98,
        onTimeRate: 95,
        repeatClientRate: 85,
        disputeRate: 1,
      },
      topRated: true,
    },
  ]);

  const removeContractor = (id: string) => {
    if (selectedContractors.length <= 2) {
      Alert.alert("Cannot Remove", "You need at least 2 contractors to compare");
      return;
    }
    setSelectedContractors((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Compare Contractors",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={[styles.headerRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={[styles.headerLabelCell, { backgroundColor: colors.background }]}>
              <Text style={[styles.headerLabelText, { color: colors.text }]}>Compare</Text>
            </View>
            {selectedContractors.map((contractor) => (
              <View key={contractor.id} style={[styles.contractorHeader, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: colors.error + "20" }]}
                  onPress={() => removeContractor(contractor.id)}
                >
                  <X size={16} color={colors.error} />
                </TouchableOpacity>
                <Image
                  source={
                    contractor.avatar
                      ? { uri: contractor.avatar }
                      : require("@/assets/images/icon.png")
                  }
                  style={styles.avatar}
                />
                <Text style={[styles.contractorName, { color: colors.text }]}>{contractor.name}</Text>
                <Text style={[styles.contractorCompany, { color: colors.textSecondary }]}>{contractor.company}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#fbbf24" fill="#fbbf24" />
                  <Text style={[styles.rating, { color: colors.text }]}>{contractor.rating}</Text>
                  <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>({contractor.reviewCount})</Text>
                </View>
                <View style={styles.badgesContainer}>
                  <PromotionalBadges
                    badges={getBadgesForContractor(contractor)}
                    size="small"
                    showIcon={false}
                  />
                </View>
              </View>
            ))}
          </View>

          <ComparisonRow
            label="Location"
            colors={colors}
            values={selectedContractors.map((c) => (
              <View key={c.id} style={styles.iconRow}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={[styles.valueText, { color: colors.text }]}>{c.location}</Text>
              </View>
            ))}
          />

          <ComparisonRow
            label="Trade"
            colors={colors}
            values={selectedContractors.map((c) => c.trade)}
          />

          <ComparisonRow
            label="Experience"
            colors={colors}
            values={selectedContractors.map((c) => `${c.yearsInBusiness} years`)}
          />

          <ComparisonRow
            label="Completed Projects"
            colors={colors}
            values={selectedContractors.map((c) => (
              <View key={c.id} style={styles.iconRow}>
                <Briefcase size={14} color={colors.textSecondary} />
                <Text style={[styles.valueText, { color: colors.text }]}>{c.completedProjects}</Text>
              </View>
            ))}
          />

          <ComparisonRow
            label="Insurance"
            colors={colors}
            values={selectedContractors.map((c) => (
              <View key={c.id} style={styles.iconRow}>
                <DollarSign size={14} color={colors.success} />
                <Text style={[styles.valueText, { color: colors.text }]}>{c.insuranceAmount}</Text>
              </View>
            ))}
          />

          <ComparisonRow
            label="License"
            colors={colors}
            values={selectedContractors.map((c) => c.licenseNumber || "N/A")}
          />

          <ComparisonRow
            label="Response Time"
            colors={colors}
            values={selectedContractors.map((c) =>
              c.trustIndicators
                ? `${c.trustIndicators.responseTime} min`
                : "N/A"
            )}
          />

          <ComparisonRow
            label="Response Rate"
            colors={colors}
            values={selectedContractors.map((c) =>
              c.trustIndicators ? `${c.trustIndicators.responseRate}%` : "N/A"
            )}
          />

          <ComparisonRow
            label="On-Time Rate"
            colors={colors}
            values={selectedContractors.map((c) =>
              c.trustIndicators ? `${c.trustIndicators.onTimeRate}%` : "N/A"
            )}
          />

          <ComparisonRow
            label="Repeat Clients"
            colors={colors}
            values={selectedContractors.map((c) =>
              c.trustIndicators
                ? `${c.trustIndicators.repeatClientRate}%`
                : "N/A"
            )}
          />

          <ComparisonRow
            label="Specialties"
            colors={colors}
            values={selectedContractors.map((c) => (
              <View key={c.id} style={styles.specialtiesContainer}>
                {c.specialties?.slice(0, 3).map((specialty, idx) => (
                  <View key={idx} style={[styles.specialtyTag, { backgroundColor: colors.info + "20" }]}>
                    <Text style={[styles.specialtyText, { color: colors.info }]}>{specialty}</Text>
                  </View>
                ))}
              </View>
            ))}
          />

          <View style={[styles.actionsRow, { backgroundColor: colors.background }]}>
            <View style={[styles.labelCell, { backgroundColor: colors.background }]} />
            {selectedContractors.map((contractor) => (
              <View key={contractor.id} style={styles.valueCell}>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/contractor-profile?id=${contractor.id}`)}
                >
                  <Text style={[styles.contactButtonText, { color: colors.white }]}>View Profile</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  table: {
    minWidth: 800,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: staticColors.surface,
    borderBottomWidth: 2,
    borderBottomColor: staticColors.border,
  },
  headerLabelCell: {
    width: 150,
    padding: 16,
    justifyContent: "center",
    backgroundColor: staticColors.background,
  },
  headerLabelText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  contractorHeader: {
    width: 220,
    padding: 16,
    alignItems: "center",
    backgroundColor: staticColors.surface,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: staticColors.error + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 2,
  },
  contractorCompany: {
    fontSize: 13,
    color: staticColors.textSecondary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  reviewCount: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  badgesContainer: {
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
    backgroundColor: staticColors.surface,
  },
  labelCell: {
    width: 150,
    padding: 16,
    justifyContent: "center",
    backgroundColor: staticColors.background,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  valueCell: {
    width: 220,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  valueText: {
    fontSize: 14,
    color: staticColors.text,
    textAlign: "center",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
  },
  specialtyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: staticColors.info + "20",
    borderRadius: 4,
  },
  specialtyText: {
    fontSize: 11,
    color: staticColors.info,
    fontWeight: "600" as const,
  },
  actionsRow: {
    flexDirection: "row",
    backgroundColor: staticColors.background,
    paddingVertical: 16,
  },
  contactButton: {
    backgroundColor: staticColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
});
