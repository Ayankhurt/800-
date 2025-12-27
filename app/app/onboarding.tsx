import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";

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
import {
  Sparkles,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Shield,
  CheckCircle,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { TRADES } from "@/constants/trades";

const ONBOARDING_STEPS = [
  { id: "profile", title: "Complete Profile", icon: Building2 },
  { id: "expertise", title: "Your Expertise", icon: Briefcase },
  { id: "verification", title: "Verification", icon: Shield },
] as const;

type OnboardingStep = typeof ONBOARDING_STEPS[number]["id"];

interface ProfileData {
  bio: string;
  location: string;
  yearsExperience: string;
  trades: string[];
  specialties: string[];
  insuranceAmount: string;
  licenseNumber: string;
  serviceArea: string;
}

export default function OnboardingScreen() {
  const { user, updateUser, colors } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("profile");
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    bio: "",
    location: "",
    yearsExperience: "",
    trades: [],
    specialties: [],
    insuranceAmount: "",
    licenseNumber: "",
    serviceArea: "",
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    generateSmartSuggestions();
  }, [currentStep, profileData, user?.role]);

  const generateSmartSuggestions = () => {
    const newSuggestions: string[] = [];

    if (currentStep === "profile") {
      if (!profileData.bio) {
        newSuggestions.push(
          user?.role === "GC"
            ? "Add a bio highlighting your project management experience"
            : "Describe your expertise and what makes you stand out"
        );
      }

      if (!profileData.location) {
        newSuggestions.push("Add your location to help clients find you");
      }

      if (!profileData.yearsExperience) {
        newSuggestions.push("Years of experience builds trust with potential clients");
      }
    }

    if (currentStep === "expertise") {
      if (profileData.trades.length === 0) {
        newSuggestions.push("Select your primary trade to get relevant job opportunities");
      } else if (profileData.trades.length === 1) {
        newSuggestions.push("Consider adding related trades to expand opportunities");
      }

      if (profileData.specialties.length === 0) {
        newSuggestions.push("Adding specialties helps you stand out in specific niches");
      }

      if (!profileData.serviceArea) {
        newSuggestions.push("Define your service area to match with nearby projects");
      }
    }

    if (currentStep === "verification") {
      if (!profileData.licenseNumber) {
        newSuggestions.push("Adding a license number increases trust by 60%");
      }

      if (!profileData.insuranceAmount) {
        newSuggestions.push("Verified insurance coverage can increase your bids by 40%");
      }

      if (user?.role === "SUB" || user?.role === "TS") {
        newSuggestions.push("Complete verification to access premium job postings");
      }
    }

    setSuggestions(newSuggestions);
  };

  const getRoleSuggestions = () => {
    const role = user?.role;

    if (role === "GC") {
      return [
        "Highlight your project management credentials",
        "Mention notable projects you've completed",
        "Include team size and capabilities",
      ];
    } else if (role === "SUB" || role === "TS") {
      return [
        "Showcase your specialized skills",
        "List certifications and training",
        "Mention equipment and tools you own",
      ];
    } else if (role === "PM") {
      return [
        "Detail your project coordination experience",
        "Include software tools you're proficient in",
        "Mention your team management style",
      ];
    }

    return [
      "Be specific about your experience",
      "Mention your availability",
      "Highlight your reliability",
    ];
  };

  const getTradesSuggestions = () => {
    const role = user?.role;

    if (role === "GC") {
      return ["General Contractor", "Project Management", "Construction Management"];
    }

    if (profileData.trades.includes("Electrical")) {
      return ["Low Voltage", "Solar Installation", "Generator Installation"];
    }

    if (profileData.trades.includes("Plumbing")) {
      return ["Gas Lines", "Water Heaters", "Drain Cleaning"];
    }

    if (profileData.trades.includes("HVAC")) {
      return ["Duct Work", "Air Quality", "Refrigeration"];
    }

    return ["High-end Finishes", "Custom Work", "Emergency Service"];
  };

  const handleNext = async () => {
    const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === currentStep);

    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(ONBOARDING_STEPS[stepIndex + 1].id);
    } else {
      await handleComplete();
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      console.log("[Onboarding] Completing profile setup...");

      // 1. Update basic profile info
      const basicProfileData = {
        bio: profileData.bio,
        location: profileData.location,
      };

      await userAPI.updateProfile(basicProfileData);

      // 2. Update contractor-specific info
      if (user?.role === "GC" || user?.role === "SUB" || user?.role === "TS") {
        const contractorData = {
          experience_years: profileData.yearsExperience ? parseInt(profileData.yearsExperience) : undefined,
          specialties: profileData.specialties,
          license_number: profileData.licenseNumber,
          insurance_amount: profileData.insuranceAmount ? parseFloat(profileData.insuranceAmount) : undefined,
          service_area: profileData.serviceArea,
          trade_specialization: profileData.trades.join(", "),
        };

        // Remove undefined values
        const cleanContractorData = Object.fromEntries(
          Object.entries(contractorData).filter(([_, v]) => v !== undefined)
        );

        await userAPI.updateContractorProfile(cleanContractorData);
      }

      // 3. Update local context state
      await updateUser({
        ...user,
        ...profileData,
      } as any);

      Alert.alert(
        "Profile Complete!",
        "Your profile has been set up. You can always update it later in settings.",
        [{ text: "Get Started", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (error: any) {
      console.error("[Onboarding] Error saving profile:", error);
      Alert.alert("Error", error.response?.data?.message || error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => {
    const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === currentStep);
    const progress = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;

    return (
      <View style={[styles.progressContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
        </Text>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View style={[styles.suggestionsCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary + "20" }]}>
        <View style={styles.suggestionsHeader}>
          <Sparkles size={18} color={colors.primary} />
          <Text style={[styles.suggestionsTitle, { color: colors.primary }]}>Smart Suggestions</Text>
        </View>
        {suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionItem}>
            <CheckCircle size={14} color={colors.success} />
            <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderProfileStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Building2 size={32} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>Complete Your Profile</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Help others get to know you and your business
        </Text>
      </View>

      {renderSuggestions()}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Professional Bio</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {getRoleSuggestions()[0]}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder={`Tell others about your ${user?.role === "GC" ? "company and experience" : "skills and expertise"}...`}
            placeholderTextColor={colors.textTertiary}
            value={profileData.bio}
            onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MapPin size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, styles.inputWithIconText, { color: colors.text }]}
              placeholder="City, State"
              placeholderTextColor={colors.textTertiary}
              value={profileData.location}
              onChangeText={(text) => setProfileData({ ...profileData, location: text })}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Years of Experience</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Clock size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, styles.inputWithIconText, { color: colors.text }]}
              placeholder="e.g., 5, 10, 15+"
              placeholderTextColor={colors.textTertiary}
              value={profileData.yearsExperience}
              onChangeText={(text) => setProfileData({ ...profileData, yearsExperience: text })}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderExpertiseStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Briefcase size={32} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>Your Expertise</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Select your trades and specialties to get matched with relevant work
        </Text>
      </View>

      {renderSuggestions()}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Primary Trade(s)</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Select all that apply</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsContainer}
          >
            {TRADES.slice(1, 20).map((trade) => {
              const isSelected = profileData.trades.includes(trade);
              return (
                <TouchableOpacity
                  key={trade}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && [styles.chipSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      setProfileData({
                        ...profileData,
                        trades: profileData.trades.filter(t => t !== trade),
                      });
                    } else {
                      setProfileData({
                        ...profileData,
                        trades: [...profileData.trades, trade],
                      });
                    }
                  }}
                >
                  <Text style={[
                    styles.chipText,
                    { color: colors.text },
                    isSelected && [styles.chipTextSelected, { color: colors.white }],
                  ]}>
                    {trade}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Specialties</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            What makes you unique? Add custom specialties
          </Text>
          <View style={styles.suggestedChips}>
            {getTradesSuggestions().map((specialty) => {
              const isSelected = profileData.specialties.includes(specialty);
              return (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && [styles.chipSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      setProfileData({
                        ...profileData,
                        specialties: profileData.specialties.filter(s => s !== specialty),
                      });
                    } else {
                      setProfileData({
                        ...profileData,
                        specialties: [...profileData.specialties, specialty],
                      });
                    }
                  }}
                >
                  <Text style={[
                    styles.chipText,
                    { color: colors.text },
                    isSelected && [styles.chipTextSelected, { color: colors.white }],
                  ]}>
                    {specialty}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Service Area</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g., Within 50 miles of Denver, CO"
            placeholderTextColor={colors.textTertiary}
            value={profileData.serviceArea}
            onChangeText={(text) => setProfileData({ ...profileData, serviceArea: text })}
          />
        </View>
      </View>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Shield size={32} color={colors.primary} />
        <Text style={[styles.stepTitle, { color: colors.text }]}>Build Trust</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Verification increases your chances of winning bids
        </Text>
      </View>

      {renderSuggestions()}

      <View style={[styles.trustStats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.trustStat}>
          <Text style={[styles.trustStatValue, { color: colors.primary }]}>60%</Text>
          <Text style={[styles.trustStatLabel, { color: colors.textSecondary }]}>Higher Trust</Text>
        </View>
        <View style={styles.trustStat}>
          <Text style={[styles.trustStatValue, { color: colors.primary }]}>40%</Text>
          <Text style={[styles.trustStatLabel, { color: colors.textSecondary }]}>More Bids</Text>
        </View>
        <View style={styles.trustStat}>
          <Text style={[styles.trustStatValue, { color: colors.primary }]}>3x</Text>
          <Text style={[styles.trustStatLabel, { color: colors.textSecondary }]}>More Callbacks</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>License Number (Optional)</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FileText size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, styles.inputWithIconText, { color: colors.text }]}
              placeholder="Enter your license number"
              placeholderTextColor={colors.textTertiary}
              value={profileData.licenseNumber}
              onChangeText={(text) => setProfileData({ ...profileData, licenseNumber: text })}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Insurance Coverage (Optional)</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Shield size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, styles.inputWithIconText, { color: colors.text }]}
              placeholder="e.g., $1M General Liability"
              placeholderTextColor={colors.textTertiary}
              value={profileData.insuranceAmount}
              onChangeText={(text) => setProfileData({ ...profileData, insuranceAmount: text })}
            />
          </View>
        </View>

        <View style={[styles.verificationInfo, { backgroundColor: colors.info + "15", borderColor: colors.info + "30" }]}>
          <Text style={[styles.verificationInfoText, { color: colors.text }]}>
            You can upload verification documents later in your profile settings.
            Verified accounts get priority in search results!
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case "profile":
        return renderProfileStep();
      case "expertise":
        return renderExpertiseStep();
      case "verification":
        return renderVerificationStep();
      default:
        return null;
    }
  };

  const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === currentStep);
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderProgressBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: colors.border }]}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={[styles.nextButtonText, { color: colors.white }]}>
                {isLastStep ? "Complete" : "Next"}
              </Text>
              <ChevronRight size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  progressContainer: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: staticColors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: staticColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: staticColors.textSecondary,
    fontWeight: "600" as const,
    textAlign: "center",
  },
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  suggestionsCard: {
    backgroundColor: staticColors.primaryLight,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: staticColors.primary + "20",
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: staticColors.text,
    lineHeight: 18,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  hint: {
    fontSize: 13,
    color: staticColors.textSecondary,
    marginTop: -4,
  },
  input: {
    backgroundColor: staticColors.surface,
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: staticColors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: staticColors.surface,
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputWithIconText: {
    flex: 1,
    borderWidth: 0,
    padding: 16,
    paddingLeft: 0,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  suggestedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: staticColors.surface,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  chipSelected: {
    backgroundColor: staticColors.primary,
    borderColor: staticColors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  chipTextSelected: {
    color: staticColors.white,
  },
  trustStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  trustStat: {
    alignItems: "center",
    gap: 4,
  },
  trustStatValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  trustStatLabel: {
    fontSize: 12,
    color: staticColors.textSecondary,
    fontWeight: "600" as const,
  },
  verificationInfo: {
    backgroundColor: staticColors.info + "15",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: staticColors.info + "30",
  },
  verificationInfoText: {
    fontSize: 13,
    color: staticColors.text,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    padding: 24,
    backgroundColor: staticColors.surface,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
  },
  skipButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  nextButton: {
    flex: 2,
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    backgroundColor: staticColors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
});
