import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import {
  Shield,
  CheckCircle,
  FileCheck,
  X,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import { Verification, VerificationType } from "@/types";
import { getVerificationLabel } from "@/utils/trust";
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
};

interface VerificationBadgeProps {
  verifications: Verification[];
  size?: "small" | "medium" | "large";
  showDetails?: boolean;
}

function getVerificationIcon(type: VerificationType, size: number, colors: any) {
  switch (type) {
    case "identity":
      return <Shield size={size} color={colors.success} />;
    case "license":
      return <FileCheck size={size} color={colors.success} />;
    case "insurance":
      return <Shield size={size} color={colors.success} />;
    case "background":
      return <CheckCircle size={size} color={colors.success} />;
    case "references":
      return <CheckCircle size={size} color={colors.success} />;
    case "payment":
      return <CheckCircle size={size} color={colors.success} />;
    default:
      return <CheckCircle size={size} color={colors.success} />;
  }
}

function getVerificationDescription(type: VerificationType): string {
  switch (type) {
    case "identity":
      return "Government-issued ID verified by platform administrators";
    case "license":
      return "Professional license verified and current with state authorities";
    case "insurance":
      return "General liability and workers' compensation insurance verified";
    case "background":
      return "Background check completed, including criminal history";
    case "references":
      return "Professional references contacted and verified";
    case "payment":
      return "Payment method verified and validated";
    default:
      return "Verification completed";
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExpiringSoon(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
}

function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function VerificationBadge({
  verifications,
  size = "medium",
  showDetails = true,
}: VerificationBadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors } = useAuth();

  const verifiedCount = verifications.filter((v) => v.verified).length;
  const totalCount = verifications.length;

  const iconSize = size === "small" ? 12 : size === "medium" ? 16 : 20;
  const fontSize = size === "small" ? 11 : size === "medium" ? 13 : 15;

  if (!showDetails) {
    return (
      <View style={[styles.badge, styles[`badge${size}`], { backgroundColor: colors.success + "15" }]}>
        <CheckCircle size={iconSize} color={colors.success} />
        <Text style={[styles.badgeText, { fontSize, color: colors.success }]}>
          {verifiedCount}/{totalCount} Verified
        </Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.badge, styles[`badge${size}`], { backgroundColor: colors.success + "15" }]}
        onPress={() => setModalVisible(true)}
      >
        <CheckCircle size={iconSize} color={colors.success} />
        <Text style={[styles.badgeText, { fontSize, color: colors.success }]}>
          {verifiedCount}/{totalCount} Verified
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Verification Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentInner}
          >
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: colors.primary + "15" }]}>
                <Shield size={48} color={colors.primary} />
              </View>
              <View style={styles.summaryText}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>
                  {verifiedCount} of {totalCount} Verifications
                </Text>
                <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
                  This contractor has completed {verifiedCount} verification
                  {verifiedCount !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Verification Status</Text>

            {verifications.map((verification, index) => {
              const expired = isExpired(verification.expiresAt);
              const expiringSoon = isExpiringSoon(verification.expiresAt);

              return (
                <View
                  key={index}
                  style={[
                    styles.verificationCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    verification.verified && !expired && { borderColor: colors.success + "30", backgroundColor: colors.success + "05" },
                    expired && { borderColor: colors.error + "30", backgroundColor: colors.error + "05" },
                  ]}
                >
                  <View style={styles.verificationHeader}>
                    <View style={[styles.verificationIcon, { backgroundColor: colors.background }]}>
                      {verification.verified && !expired ? (
                        getVerificationIcon(verification.type, 24, colors)
                      ) : (
                        <FileCheck size={24} color={colors.textTertiary} />
                      )}
                    </View>
                    <View style={styles.verificationInfo}>
                      <Text style={[styles.verificationName, { color: colors.text }]}>
                        {getVerificationLabel(verification.type)}
                      </Text>
                      <Text style={[styles.verificationDescription, { color: colors.textSecondary }]}>
                        {getVerificationDescription(verification.type)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.verificationDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        {verification.verified && !expired ? (
                          <CheckCircle size={16} color={colors.success} />
                        ) : (
                          <Clock size={16} color={colors.textTertiary} />
                        )}
                      </View>
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        Status:{" "}
                        <Text
                          style={[
                            styles.detailValue,
                            { color: colors.text },
                            verification.verified && !expired && { color: colors.success },
                            expired && { color: colors.error },
                          ]}
                        >
                          {expired
                            ? "Expired"
                            : verification.verified
                              ? "Verified"
                              : "Pending"}
                        </Text>
                      </Text>
                    </View>

                    {verification.verifiedAt && (
                      <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                          <Calendar size={16} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          Verified:{" "}
                          <Text style={[styles.detailValue, { color: colors.text }]}>
                            {formatDate(verification.verifiedAt)}
                          </Text>
                        </Text>
                      </View>
                    )}

                    {verification.expiresAt && (
                      <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                          {expiringSoon || expired ? (
                            <AlertCircle
                              size={16}
                              color={expired ? colors.error : colors.warning}
                            />
                          ) : (
                            <Calendar size={16} color={colors.textSecondary} />
                          )}
                        </View>
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          Expires:{" "}
                          <Text
                            style={[
                              styles.detailValue,
                              { color: colors.text },
                              expiringSoon && { color: colors.warning },
                              expired && { color: colors.error },
                            ]}
                          >
                            {formatDate(verification.expiresAt)}
                            {expiringSoon && !expired && " (Expiring Soon)"}
                          </Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={[styles.infoBox, { backgroundColor: colors.info + "10", borderColor: colors.info + "20" }]}>
              <View style={styles.infoIcon}>
                <AlertCircle size={20} color={colors.info} />
              </View>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                All verifications are conducted by our platform team to ensure
                contractor credibility and protect project owners.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: staticColors.success + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  badgesmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgemedium: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  badgelarge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  badgeText: {
    fontWeight: "600" as const,
    color: staticColors.success,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
    backgroundColor: staticColors.surface,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: "row" as const,
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: staticColors.border,
    gap: 16,
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: staticColors.primary + "15",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  summaryText: {
    flex: 1,
    justifyContent: "center" as const,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  verificationCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  verificationCardVerified: {
    borderColor: staticColors.success + "30",
    backgroundColor: staticColors.success + "05",
  },
  verificationCardExpired: {
    borderColor: staticColors.error + "30",
    backgroundColor: staticColors.error + "05",
  },
  verificationHeader: {
    flexDirection: "row" as const,
    marginBottom: 12,
    gap: 12,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: staticColors.background,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  verificationDescription: {
    fontSize: 13,
    color: staticColors.textSecondary,
    lineHeight: 18,
  },
  verificationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  detailIcon: {
    width: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  detailText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  detailValue: {
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  detailValueSuccess: {
    color: staticColors.success,
  },
  detailValueWarning: {
    color: staticColors.warning,
  },
  detailValueError: {
    color: staticColors.error,
  },
  infoBox: {
    flexDirection: "row" as const,
    backgroundColor: staticColors.info + "10",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: staticColors.info + "20",
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: staticColors.textSecondary,
    lineHeight: 18,
  },
});
