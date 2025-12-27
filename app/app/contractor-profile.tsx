import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import {
  MapPin,
  Phone,
  Mail,
  Star,
  BadgeCheck,
  Calendar,
  Award,
  Briefcase,
  Clock,
  X,
  Shield,
  CheckCircle,
  TrendingUp,
  Heart,
  Share2,
  Flag,
  Video,
  Edit,
} from "lucide-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useSavedContractors } from "@/contexts/SavedContractorsContext";
import { useVideoConsultations } from "@/contexts/VideoConsultationsContext";
import TrustSuggestions from "@/components/TrustSuggestions";
import VerificationBadge from "@/components/VerificationBadge";
import ReviewsList from "@/components/ReviewsList";
import PortfolioGallery from "@/components/PortfolioGallery";
import Endorsements from "@/components/Endorsements";
import CertificationsAndAwards from "@/components/CertificationsAndAwards";
import ExperienceTimeline from "@/components/ExperienceTimeline";
import BeforeAfterComparison from "@/components/BeforeAfterComparison";
import {
  calculateTrustScore,
  getTrustLevelColor,
  getTrustLevelLabel
} from "@/utils/trust";
import { Contractor } from "@/types";
import { contractorsAPI } from "@/services/api";

function TrustScoreCard({ contractor, colors }: { contractor: Contractor; colors: any }) {
  const trustScore = calculateTrustScore(contractor);
  const color = getTrustLevelColor(trustScore.level);

  return (
    <View style={[styles.trustScoreCard, { backgroundColor: colors.background, borderColor: color + "30" }]}>
      <View style={[styles.trustScoreBadge, { backgroundColor: color }]}>
        <Shield size={24} color={colors.white} />
        <Text style={styles.trustScoreValue}>{Number.isNaN(trustScore.score) ? 0 : trustScore.score}</Text>
      </View>
      <View style={styles.trustScoreInfo}>
        <Text style={[styles.trustScoreLabel, { color: colors.textSecondary }]}>Trust Score</Text>
        <Text style={[styles.trustScoreLevel, { color }]}>
          {getTrustLevelLabel(trustScore.level)}
        </Text>
        <View style={styles.trustScoreBreakdown}>
          <Text style={[styles.trustScoreBreakdownText, { color: colors.textSecondary }]}>
            Verification: {trustScore.verificationScore}% • Performance: {trustScore.performanceScore}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ContractorProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user, colors } = useAuth();
  const { createAppointment } = useAppointments();
  const { isSaved, saveContractor, unsaveContractor } = useSavedContractors();
  const { requestConsultation } = useVideoConsultations();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVideoConsultModal, setShowVideoConsultModal] = useState(false);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const contractorId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (contractorId) {
      fetchContractor();
    }
  }, [contractorId]);

  const fetchContractor = async () => {
    if (!contractorId) return;

    try {
      setIsLoading(true);
      console.log("[API] GET /contractors/:id", contractorId);
      const response = await contractorsAPI.getById(contractorId);

      if (response.success && response.data) {
        // Map backend contractor format to frontend Contractor type
        const contractorData = response.data;
        const firstName = contractorData.first_name || contractorData.firstName || "";
        const lastName = contractorData.last_name || contractorData.lastName || "";
        const fullName = (firstName + " " + lastName).trim() || contractorData.name || "Unknown";

        setContractor({
          id: contractorData.id || contractorData.user_id,
          name: fullName,
          company: contractorData.company_name || contractorData.company || "",
          trade: contractorData.trade_specialization || contractorData.trade || "All",
          location: contractorData.location || "Location not specified",
          phone: contractorData.phone || "",
          email: contractorData.email || "",
          bio: contractorData.bio || "",
          rating: Number(contractorData.rating || 0),
          reviewCount: contractorData.review_count || 0,
          verified: contractorData.verification_status === 'verified' || !!contractorData.verified,
          featured: !!contractorData.featured,
          topRated: !!contractorData.top_rated,
          completedProjects: contractorData.completed_projects || 0,
          verifications: contractorData.verifications || [],
          reviews: (contractorData.reviews || []).map((rev: any) => ({
            id: rev.id,
            authorId: rev.reviewer?.id,
            authorName: rev.reviewer?.first_name ? `${rev.reviewer.first_name} ${rev.reviewer.last_name || ''}`.trim() : "System User",
            authorCompany: rev.reviewer?.company_name || "",
            rating: rev.rating,
            comment: rev.comment,
            date: rev.created_at,
            helpful: 0,
            response: rev.contractor_response ? {
              message: rev.contractor_response,
              date: rev.response_date
            } : undefined
          })),
          portfolio: (contractorData.portfolio || []).map((p: any) => ({
            id: p.id,
            projectName: p.title,
            description: p.description,
            images: p.images || [],
            completedDate: p.completion_date,
            category: p.project_type || ""
          })),
          certifications: (contractorData.certifications || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            issuingOrganization: c.issuing_organization,
            issueDate: c.issue_date,
            expiryDate: c.expiry_date,
            credentialId: c.credential_id
          })),
          trustIndicators: contractorData.trustIndicators,
          availability: contractorData.availability,
          licenseNumber: contractorData.license_number || "",
          insuranceAmount: contractorData.insurance_amount || "",
          yearsInBusiness: contractorData.experience_years || 0,
          specialties: contractorData.specialties || [],
        } as any);
      } else if (response.data) {
        const contractorData = response.data;
        const firstName = contractorData.first_name || contractorData.firstName || "";
        const lastName = contractorData.last_name || contractorData.lastName || "";
        const fullName = (firstName + " " + lastName).trim() || contractorData.name || "Unknown";

        setContractor({
          id: contractorData.id || contractorData.user_id,
          name: fullName,
          company: contractorData.company_name || contractorData.company || "",
          trade: contractorData.trade_specialization || contractorData.trade || "All",
          location: contractorData.location || "Location not specified",
          phone: contractorData.phone || "",
          email: contractorData.email || "",
          bio: contractorData.bio || "",
          rating: Number(contractorData.trust_score || contractorData.rating || 0) / 20,
          reviewCount: contractorData.review_count || 0,
          verified: contractorData.verification_status === 'verified' || !!contractorData.verified,
          verifications: contractorData.verifications || [],
          reviews: contractorData.reviews || [],
          portfolio: contractorData.portfolio || [],
          trustIndicators: (contractorData.trustIndicators && Object.keys(contractorData.trustIndicators).length > 0) ? contractorData.trustIndicators : undefined,
          availability: contractorData.availability,
          licenseNumber: contractorData.license_number || "",
          insuranceAmount: contractorData.insurance_amount || contractorData.insurance_coverage_amount || "",
          yearsInBusiness: contractorData.experience_years || contractorData.years_in_business || 0,
          specialties: contractorData.specialties || [],
        } as any);
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to load contractor profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Contractor Profile",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading contractor profile...</Text>
        </View>
      </View>
    );
  }

  if (!contractor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Contractor Profile",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Contractor not found</Text>
        </View>
      </View>
    );
  }

  // Safely extract contractor properties with fallbacks
  const name = contractor?.name || "Unknown";
  const company = contractor?.company || "";
  const trade = contractor?.trade || "All";
  const contractorLocation = contractor?.location || "Location not specified";
  const phone = contractor?.phone || "";
  const email = contractor?.email || "";
  const rating = contractor?.rating || 0;
  const reviewCount = contractor?.reviewCount || 0;
  const verified = contractor?.verified || false;
  const isOwnProfile = user?.id === contractor?.id;

  const router = useRouter();

  // Generate avatar initials safely
  const getInitials = (nameStr: string) => {
    if (!nameStr || typeof nameStr !== 'string') return "?";
    return nameStr
      .split(" ")
      .map((n) => (n ? n[0] : ""))
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .substring(0, 2) || "?";
  };
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Contractor Profile",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 12, marginRight: 8 }}>
              {isOwnProfile && (
                <TouchableOpacity onPress={() => router.push("/edit-profile")}>
                  <Edit size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
              {!isOwnProfile && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      if (isSaved(contractor.id)) {
                        unsaveContractor(contractor.id);
                        Alert.alert("Removed", "Contractor removed from favorites");
                      } else {
                        saveContractor(contractor.id);
                        Alert.alert("Saved", "Contractor saved to favorites");
                      }
                    }}
                  >
                    <Heart
                      size={22}
                      color={isSaved(contractor.id) ? colors.error : colors.text}
                      fill={isSaved(contractor.id) ? colors.error : "none"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        if (Platform.OS === "web") {
                          await navigator.share({
                            title: `${name} - ${company || "Contractor"}`,
                            text: `Check out ${name} on BuildConnect!`,
                            url: window.location.href,
                          });
                        } else {
                          await Share.share({
                            message: `Check out ${name}${company ? ` from ${company}` : ""} on BuildConnect!`,
                            title: `${name} - ${company || "Contractor"}`,
                          });
                        }
                      } catch (error) {
                        console.error("Share failed:", error);
                      }
                    }}
                  >
                    <Share2 size={22} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowReportModal(true)}>
                    <Flag size={22} color={colors.text} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.trustScoreHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TrustScoreCard contractor={contractor} colors={colors} />
        </View>

        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarLarge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {getInitials(name)}
              </Text>
            </View>
            {verified && (
              <View style={[styles.verifiedBadge, { borderColor: colors.surface, backgroundColor: colors.primary }]}>
                <BadgeCheck size={20} color={colors.white} fill={colors.primary} />
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          {!!company && <Text style={[styles.company, { color: colors.textSecondary }]}>{company}</Text>}

          <View style={styles.ratingContainer}>
            <Star size={20} color={colors.warning} fill={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {rating.toFixed(1)} ({reviewCount} reviews)
            </Text>
          </View>

          <View style={[styles.tradeBadge, { backgroundColor: colors.primary + "15" }]}>
            <Briefcase size={16} color={colors.primary} />
            <Text style={[styles.tradeText, { color: colors.primary }]}>{trade}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
          {!!phone && (
            <View style={styles.contactItem}>
              <Phone size={18} color={colors.textSecondary} />
              <Text style={[styles.contactText, { color: colors.text }]}>{phone}</Text>
            </View>
          )}
          {!!email && (
            <View style={styles.contactItem}>
              <Mail size={18} color={colors.textSecondary} />
              <Text style={[styles.contactText, { color: colors.text }]}>{email}</Text>
            </View>
          )}
          <View style={styles.contactItem}>
            <MapPin size={18} color={colors.textSecondary} />
            <Text style={[styles.contactText, { color: colors.text }]}>{contractorLocation}</Text>
          </View>
        </View>

        {contractor.verifications && contractor.verifications.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Verifications</Text>
            <VerificationBadge
              verifications={contractor.verifications}
              size="large"
              showDetails
            />
          </View>
        )}

        {contractor.trustIndicators && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trust Indicators</Text>
            <View style={styles.indicatorsGrid}>
              <View style={[styles.indicatorCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TrendingUp size={20} color={colors.info} />
                <Text style={[styles.indicatorValue, { color: colors.text }]}>
                  {contractor.trustIndicators.responseRate ?? 0}%
                </Text>
                <Text style={[styles.indicatorLabel, { color: colors.textSecondary }]}>Response Rate</Text>
              </View>
              <View style={[styles.indicatorCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Clock size={20} color={colors.success} />
                <Text style={[styles.indicatorValue, { color: colors.text }]}>
                  {contractor.trustIndicators.responseTime ?? 24}h
                </Text>
                <Text style={[styles.indicatorLabel, { color: colors.textSecondary }]}>Avg Response</Text>
              </View>
              <View style={[styles.indicatorCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <CheckCircle size={20} color={colors.primary} />
                <Text style={[styles.indicatorValue, { color: colors.text }]}>
                  {contractor.trustIndicators.onTimeRate ?? 0}%
                </Text>
                <Text style={[styles.indicatorLabel, { color: colors.textSecondary }]}>On-Time Rate</Text>
              </View>
            </View>
          </View>
        )}

        <TrustSuggestions contractor={contractor} />

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Award size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{contractor?.completedProjects || contractor?.completed_projects || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed Projects</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Star size={24} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>{rating.toFixed(1)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Average Rating</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Clock size={24} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.text }]}>{contractor.trustIndicators?.onTimeRate ?? '100'}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>On-Time Delivery</Text>
            </View>
          </View>
        </View>

        {contractor.endorsements && contractor.endorsements.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Endorsements endorsements={contractor.endorsements} />
          </View>
        )}

        {(contractor.certifications || contractor.awards) && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <CertificationsAndAwards
              certifications={contractor.certifications}
              awards={contractor.awards}
            />
          </View>
        )}

        {contractor.experienceTimeline && contractor.experienceTimeline.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <ExperienceTimeline timeline={contractor.experienceTimeline} />
          </View>
        )}

        {contractor.beforeAfterProjects && contractor.beforeAfterProjects.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <BeforeAfterComparison projects={contractor.beforeAfterProjects} />
          </View>
        )}

        {contractor.portfolio && contractor.portfolio.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <PortfolioGallery portfolio={contractor.portfolio} />
          </View>
        )}

        {contractor.reviews && contractor.reviews.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews & Ratings</Text>
            <ReviewsList
              reviews={contractor.reviews || []}
              averageRating={rating}
              totalReviews={reviewCount}
            />
          </View>
        )}

        {contractor.availability && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Availability</Text>
            <Text style={[styles.availabilityText, { color: colors.textTertiary }]}>
              Next Available: {new Date(contractor.availability.nextAvailable || "").toLocaleDateString()}
            </Text>
            <View style={styles.calendarGrid}>
              {contractor.availability.calendar.slice(0, 7).map((day) => (
                <View key={day.date} style={styles.calendarDay}>
                  <Text style={[styles.calendarDayName, { color: colors.textSecondary }]}>
                    {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                  <View
                    style={[
                      styles.calendarDayIndicator,
                      day.available
                        ? [styles.calendarDayAvailable, { backgroundColor: colors.success + "20", borderColor: colors.success }]
                        : [styles.calendarDayUnavailable, { backgroundColor: colors.border + "50", borderColor: colors.border }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayNumber,
                        day.available
                          ? [styles.calendarDayNumberAvailable, { color: colors.success }]
                          : [styles.calendarDayNumberUnavailable, { color: colors.textTertiary }],
                      ]}
                    >
                      {new Date(day.date).getDate()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[styles.editFullButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={() => router.push("/edit-profile")}
          >
            <Edit size={20} color={colors.white} />
            <Text style={[styles.editFullButtonText, { color: colors.white }]}>Edit My Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.callButton, { backgroundColor: colors.secondary }]}
              onPress={() => Alert.alert("Call", phone ? `Calling ${phone}` : "Phone number not available")}
            >
              <Phone size={20} color={colors.white} />
              <Text style={[styles.callButtonText, { color: colors.white }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.videoButton, { backgroundColor: colors.info }]}
              onPress={() => setShowVideoConsultModal(true)}
            >
              <Video size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.requestButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowRequestModal(true)}
            >
              <Calendar size={20} color={colors.white} />
              <Text style={[styles.requestButtonText, { color: colors.white }]}>Request Estimate</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <RequestEstimateModal
        visible={showRequestModal}
        contractor={contractor}
        colors={colors}
        onClose={() => setShowRequestModal(false)}
        onSubmit={async (data) => {
          if (!user) return;

          try {
            await createAppointment({
              title: `Estimate Request - ${data.projectName}`,
              contractorId: contractor.id,
              contractorName: name,
              contractorCompany: company || "",
              date: data.preferredDate,
              time: data.preferredTime,
              type: "estimate",
              location: data.location,
              notes: data.description,
            });

            Alert.alert(
              "Success",
              `Estimate request sent to ${name}`,
              [{ text: "OK" }]
            );

            setShowRequestModal(false);
          } catch (error) {
            console.error("Failed to create appointment:", error);
            Alert.alert("Error", "Failed to send estimate request");
          }
        }}
      />

      <ReportModal
        visible={showReportModal}
        contractor={contractor}
        colors={colors}
        onClose={() => setShowReportModal(false)}
        onSubmit={async (data) => {
          console.log("Report submitted:", data);
          Alert.alert(
            "Report Submitted",
            "Thank you for your report. We will review it shortly.",
            [{ text: "OK" }]
          );
          setShowReportModal(false);
        }}
      />

      <VideoConsultModal
        visible={showVideoConsultModal}
        contractor={contractor}
        colors={colors}
        onClose={() => setShowVideoConsultModal(false)}
        onSubmit={async (data) => {
          if (!user) return;

          try {
            await requestConsultation({
              contractorId: contractor.id,
              contractorName: name,
              scheduledDate: data.scheduledDate,
              scheduledTime: data.scheduledTime,
              duration: data.duration,
              topic: data.topic,
              notes: data.notes,
            });

            Alert.alert(
              "Request Sent",
              `Video consultation request sent to ${name}`,
              [{ text: "OK" }]
            );

            setShowVideoConsultModal(false);
          } catch (error) {
            console.error("Failed to request consultation:", error);
            Alert.alert("Error", "Failed to send consultation request");
          }
        }}
      />
    </View>
  );
}

function RequestEstimateModal({
  visible,
  contractor,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  contractor: any;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  colors: any;
}) {
  const [formData, setFormData] = useState({
    projectName: "",
    location: "",
    description: "",
    preferredDate: new Date().toISOString().split("T")[0],
    preferredTime: "09:00",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.projectName || !formData.location || !formData.description) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        projectName: "",
        location: "",
        description: "",
        preferredDate: new Date().toISOString().split("T")[0],
        preferredTime: "09:00",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Request Estimate</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View style={[styles.modalContractorInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalInfoLabel, { color: colors.textTertiary }]}>Contractor:</Text>
            <Text style={[styles.modalInfoValue, { color: colors.text }]}>
              {contractor?.name || contractor?.full_name || contractor?.fullName || "Unknown"}
            </Text>
            {!!(contractor?.company || contractor?.company_name) && (
              <Text style={[styles.modalInfoCompany, { color: colors.textSecondary }]}>
                {contractor?.company || contractor?.company_name || contractor?.companyName}
              </Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Project Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Kitchen Remodel"
              value={formData.projectName}
              onChangeText={(text) =>
                setFormData({ ...formData, projectName: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Project address or location"
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Project Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe the work you need estimated..."
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={[styles.label, { color: colors.text }]}>Preferred Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                value={formData.preferredDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, preferredDate: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={[styles.label, { color: colors.text }]}>Preferred Time</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="HH:MM"
                value={formData.preferredTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, preferredTime: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Calendar size={20} color={colors.white} />
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Sending..." : "Send Request"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function VideoConsultModal({
  visible,
  contractor,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  contractor: any;
  onClose: () => void;
  onSubmit: (data: {
    scheduledDate: string;
    scheduledTime: string;
    duration: number;
    topic: string;
    notes?: string;
  }) => Promise<void>;
  colors: any;
}) {
  const [formData, setFormData] = useState({
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "10:00",
    duration: 30,
    topic: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const durations = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
  ];

  const handleSubmit = async () => {
    if (!formData.topic.trim()) {
      Alert.alert("Error", "Please enter a consultation topic");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        scheduledDate: new Date().toISOString().split("T")[0],
        scheduledTime: "10:00",
        duration: 30,
        topic: "",
        notes: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Request Video Consultation</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View style={[styles.modalContractorInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalInfoLabel, { color: colors.textTertiary }]}>Contractor:</Text>
            <Text style={[styles.modalInfoValue, { color: colors.text }]}>
              {contractor?.name || contractor?.full_name || contractor?.fullName || "Unknown"}
            </Text>
            {!!(contractor?.company || contractor?.company_name) && (
              <Text style={[styles.modalInfoCompany, { color: colors.textSecondary }]}>
                {contractor?.company || contractor?.company_name || contractor?.companyName}
              </Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Topic *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="What would you like to discuss?"
              value={formData.topic}
              onChangeText={(text) =>
                setFormData({ ...formData, topic: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Duration *</Text>
            <View style={styles.durationGrid}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    styles.durationOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    formData.duration === d.value && [styles.durationOptionActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => setFormData({ ...formData, duration: d.value })}
                >
                  <Text
                    style={[
                      styles.durationText,
                      { color: colors.textSecondary },
                      formData.duration === d.value && [styles.durationTextActive, { color: colors.white }],
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroupHalf}>
              <Text style={[styles.label, { color: colors.text }]}>Preferred Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                value={formData.scheduledDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, scheduledDate: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={[styles.label, { color: colors.text }]}>Preferred Time</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="HH:MM"
                value={formData.scheduledTime}
                onChangeText={(text) =>
                  setFormData({ ...formData, scheduledTime: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Any specific topics or questions to cover..."
              value={formData.notes}
              onChangeText={(text) =>
                setFormData({ ...formData, notes: text })
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Video size={20} color={colors.white} />
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Sending..." : "Send Request"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ReportModal({
  visible,
  contractor,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  contractor: any;
  onClose: () => void;
  onSubmit: (data: { reason: string; description: string }) => Promise<void>;
  colors: any;
}) {
  const [reason, setReason] = useState("inappropriate");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "scam", label: "Suspected Scam" },
    { value: "fake_profile", label: "Fake Profile" },
    { value: "harassment", label: "Harassment" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert("Error", "Please provide a description");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ reason, description });
      setReason("inappropriate");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Report Contractor</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View style={[styles.modalContractorInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalInfoLabel, { color: colors.textTertiary }]}>Reporting:</Text>
            <Text style={[styles.modalInfoValue, { color: colors.text }]}>{contractor.name}</Text>
            <Text style={[styles.modalInfoCompany, { color: colors.textSecondary }]}>{contractor.company}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Reason *</Text>
            {reasons.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.reasonOption,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  reason === r.value && [styles.reasonOptionActive, { backgroundColor: colors.primary + "10", borderColor: colors.primary }],
                ]}
                onPress={() => setReason(r.value)}
              >
                <View
                  style={[
                    styles.radio,
                    { borderColor: colors.border },
                    reason === r.value && [styles.radioActive, { borderColor: colors.primary }],
                  ]}
                >
                  {reason === r.value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    { color: colors.textSecondary },
                    reason === r.value && [styles.reasonTextActive, { color: colors.primary }],
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Please describe the issue..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Flag size={20} color={colors.white} />
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: staticColors.surface,
    padding: 24,
    alignItems: "center" as const,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  avatarContainer: {
    position: "relative" as const,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: staticColors.primary + "20",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  verifiedBadge: {
    position: "absolute" as const,
    bottom: 0,
    right: 0,
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 3,
    borderColor: staticColors.surface,
  },
  name: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    color: staticColors.textSecondary,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 16,
    color: staticColors.textSecondary,
    fontWeight: "600" as const,
  },
  tradeBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: staticColors.primary + "15",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tradeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  section: {
    backgroundColor: staticColors.surface,
    padding: 20,
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 15,
    color: staticColors.text,
  },
  statsGrid: {
    flexDirection: "row" as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
  },
  projectCard: {
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  projectHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  projectName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginRight: 12,
  },
  projectBudget: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: staticColors.success,
  },
  projectDetails: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 4,
  },
  projectLocation: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  projectDate: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  reviewCard: {
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  reviewHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  reviewAuthorInfo: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 2,
  },
  reviewCompany: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  reviewRating: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: staticColors.text,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  footer: {
    flexDirection: "row" as const,
    gap: 12,
    backgroundColor: staticColors.surface,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  editFullButton: {
    flex: 1,
    flexDirection: "row" as const,
    height: 54,
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editFullButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  callButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: staticColors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  videoButton: {
    width: 50,
    height: 50,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: staticColors.info,
    borderRadius: 12,
  },
  requestButton: {
    flex: 2,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
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
  modalContractorInfo: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 2,
  },
  modalInfoCompany: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: staticColors.text,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  trustScoreHeader: {
    backgroundColor: staticColors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  trustScoreCard: {
    flexDirection: "row" as const,
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    gap: 16,
    alignItems: "center" as const,
  },
  trustScoreBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  trustScoreValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  trustScoreInfo: {
    flex: 1,
  },
  trustScoreLabel: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginBottom: 4,
  },
  trustScoreLevel: {
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  trustScoreBreakdown: {
    marginTop: 4,
  },
  trustScoreBreakdownText: {
    fontSize: 12,
    color: staticColors.textSecondary,
  },
  verificationsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  verificationItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: staticColors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  verificationItemVerified: {
    backgroundColor: staticColors.success + "10",
    borderColor: staticColors.success + "30",
  },
  verificationText: {
    fontSize: 13,
    color: staticColors.textSecondary,
    fontWeight: "500" as const,
  },
  verificationTextVerified: {
    color: staticColors.success,
    fontWeight: "600" as const,
  },
  indicatorsGrid: {
    flexDirection: "row" as const,
    gap: 12,
  },
  indicatorCard: {
    flex: 1,
    backgroundColor: staticColors.background,
    borderRadius: 10,
    padding: 14,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: staticColors.border,
    gap: 8,
  },
  indicatorValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  indicatorLabel: {
    fontSize: 11,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
  },
  availabilityText: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: "row" as const,
    gap: 8,
  },
  calendarDay: {
    flex: 1,
    alignItems: "center" as const,
  },
  calendarDayName: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginBottom: 8,
    fontWeight: "600" as const,
  },
  calendarDayIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
  },
  calendarDayAvailable: {
    backgroundColor: staticColors.success + "15",
    borderColor: staticColors.success,
  },
  calendarDayUnavailable: {
    backgroundColor: staticColors.border,
    borderColor: staticColors.border,
  },
  calendarDayNumber: {
    fontSize: 14,
    fontWeight: "700" as const,
  },
  calendarDayNumberAvailable: {
    color: staticColors.success,
  },
  calendarDayNumberUnavailable: {
    color: staticColors.textTertiary,
  },
  reasonOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    backgroundColor: staticColors.surface,
    marginBottom: 8,
  },
  reasonOptionActive: {
    borderColor: staticColors.primary,
    backgroundColor: staticColors.primary + "10",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: staticColors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  radioActive: {
    borderColor: staticColors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: staticColors.primary,
  },
  reasonText: {
    fontSize: 15,
    color: staticColors.text,
  },
  reasonTextActive: {
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  durationGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  durationOption: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: staticColors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    alignItems: "center" as const,
  },
  durationOptionActive: {
    borderColor: staticColors.primary,
    backgroundColor: staticColors.primary + "10",
  },
  durationText: {
    fontSize: 14,
    color: staticColors.text,
  },
  durationTextActive: {
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
});
