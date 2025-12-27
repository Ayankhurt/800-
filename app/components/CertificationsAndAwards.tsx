import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Award as AwardIcon,
  GraduationCap,
  CheckCircle,
  ExternalLink,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Certification, Award } from "@/types";

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

interface CertificationsAndAwardsProps {
  certifications?: Certification[];
  awards?: Award[];
}

export default function CertificationsAndAwards({
  certifications,
  awards,
}: CertificationsAndAwardsProps) {
  const { colors } = useAuth();
  const hasCertifications = certifications && certifications.length > 0;
  const hasAwards = awards && awards.length > 0;

  if (!hasCertifications && !hasAwards) {
    return null;
  }

  return (
    <View style={styles.container}>
      {hasCertifications && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Certifications
            </Text>
          </View>

          {certifications.map((cert) => {
            const isExpired = cert.expiryDate
              ? new Date(cert.expiryDate) < new Date()
              : false;

            return (
              <View
                key={cert.id}
                style={[
                  styles.certCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.certHeader}>
                  <View style={styles.certInfo}>
                    <Text style={[styles.certName, { color: colors.text }]}>
                      {cert.name}
                    </Text>
                    <Text
                      style={[
                        styles.certOrg,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {cert.issuingOrganization}
                    </Text>
                  </View>
                  {!isExpired && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle size={16} color={colors.success} />
                    </View>
                  )}
                </View>

                <View style={styles.certDetails}>
                  <Text
                    style={[
                      styles.certDate,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Issued: {new Date(cert.issueDate).toLocaleDateString()}
                  </Text>
                  {cert.expiryDate && (
                    <Text
                      style={[
                        styles.certDate,
                        { color: colors.textSecondary },
                        isExpired && { color: colors.error },
                      ]}
                    >
                      {isExpired ? "Expired" : "Expires"}:{" "}
                      {new Date(cert.expiryDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {cert.credentialId && (
                  <Text
                    style={[
                      styles.credentialId,
                      { color: colors.textTertiary },
                    ]}
                  >
                    ID: {cert.credentialId}
                  </Text>
                )}

                {cert.verificationUrl && (
                  <View style={styles.verificationLink}>
                    <ExternalLink size={12} color={colors.primary} />
                    <Text
                      style={[
                        styles.verificationText,
                        { color: colors.primary },
                      ]}
                    >
                      Verify Credential
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {hasAwards && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AwardIcon size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Awards & Recognition
            </Text>
          </View>

          {awards.map((award) => (
            <View
              key={award.id}
              style={[
                styles.awardCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.awardHeader}>
                <View
                  style={[
                    styles.awardIconContainer,
                    { backgroundColor: colors.warning + "20" },
                  ]}
                >
                  <AwardIcon size={20} color={colors.warning} />
                </View>
                <View style={styles.awardInfo}>
                  <Text style={[styles.awardTitle, { color: colors.text }]}>
                    {award.title}
                  </Text>
                  <Text
                    style={[
                      styles.awardOrg,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {award.organization}
                  </Text>
                </View>
                <View
                  style={[
                    styles.yearBadge,
                    { backgroundColor: colors.warning + "15" },
                  ]}
                >
                  <Text style={[styles.yearText, { color: colors.warning }]}>
                    {award.year}
                  </Text>
                </View>
              </View>
              {award.description && (
                <Text
                  style={[
                    styles.awardDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {award.description}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  certCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  certHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  certOrg: {
    fontSize: 13,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  certDetails: {
    flexDirection: "row" as const,
    gap: 16,
  },
  certDate: {
    fontSize: 12,
  },
  credentialId: {
    fontSize: 11,
    fontFamily: "monospace" as const,
  },
  verificationLink: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 4,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  awardCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  awardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 8,
  },
  awardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  awardInfo: {
    flex: 1,
  },
  awardTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  awardOrg: {
    fontSize: 13,
  },
  yearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  yearText: {
    fontSize: 13,
    fontWeight: "700" as const,
  },
  awardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
