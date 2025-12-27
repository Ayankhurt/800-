import { TRADES } from "@/constants/trades";
import { Contractor } from "@/types";
import { Stack, useRouter } from "expo-router";
import {
  BadgeCheck,
  MapPin,
  Phone,
  Search,
  Star,
  Calendar,
  X,
  Shield,
  CheckCircle2,
  Filter,
  MapIcon,
  ListIcon,
  Award,
  TrendingUp,
  User,
} from "lucide-react-native";
import { calculateTrustScore, getTrustLevelColor } from "@/utils/trust";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { contractorsAPI } from "@/services/api";

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

interface ContractorCardProps {
  contractor: Contractor;
  onPress: () => void;
  onRequestEstimate: () => void;
  isOwnProfile?: boolean;
  colors: any;
}

function ContractorCard({
  contractor,
  onPress,
  onRequestEstimate,
  isOwnProfile,
  colors,
}: ContractorCardProps) {
  // Safely extract contractor properties with fallbacks
  const name =
    contractor?.name ||
    contractor?.full_name ||
    contractor?.fullName ||
    "Unknown";
  const company =
    contractor?.company ||
    contractor?.company_name ||
    contractor?.companyName ||
    "";
  const trade =
    contractor?.trade || contractor?.trade_type || contractor?.tradeType || "All";
  const location =
    contractor?.location || contractor?.address || "Location not specified";
  const rating =
    contractor?.rating ||
    contractor?.average_rating ||
    contractor?.averageRating ||
    0;
  const reviewCount = contractor?.reviewCount || contractor?.review_count || 0;
  const verified =
    contractor?.verified ||
    contractor?.is_verified ||
    contractor?.isVerified ||
    false;
  const featured =
    contractor?.featured || contractor?.is_featured || contractor?.isFeatured || false;
  const topRated =
    contractor?.topRated ||
    contractor?.top_rated ||
    contractor?.isTopRated ||
    false;
  const completedProjects =
    contractor?.completedProjects || contractor?.completed_projects || 0;
  const verifications = contractor?.verifications || [];

  const trustScore = calculateTrustScore(contractor);
  const verifiedCount =
    verifications.filter((v: any) => v?.verified).length || 0;

  // Generate avatar initials safely
  const getInitials = (nameStr: string) => {
    if (!nameStr || typeof nameStr !== "string") return "?";
    return (
      nameStr
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .substring(0, 2) || "?"
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.contractorCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.contractorHeader}>
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {getInitials(name)}
          </Text>
        </View>
        <View style={styles.contractorInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.contractorName, { color: colors.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {verified && <BadgeCheck size={16} color={colors.primary} />}
          </View>
          {company && (
            <Text
              style={[
                styles.contractorCompany,
                { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {company}
            </Text>
          )}
          <View style={styles.ratingRow}>
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {rating.toFixed(1)} ({reviewCount})
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.badgesContainer}>
        {featured && (
          <View
            style={[
              styles.featuredBadge,
              {
                backgroundColor: colors.warning + "15",
                borderColor: colors.warning + "30",
              },
            ]}
          >
            <Award size={12} color={colors.warning} />
            <Text style={[styles.featuredBadgeText, { color: colors.warning }]}>
              Featured
            </Text>
          </View>
        )}
        {topRated && (
          <View
            style={[
              styles.topRatedBadge,
              {
                backgroundColor: colors.success + "15",
                borderColor: colors.success + "30",
              },
            ]}
          >
            <TrendingUp size={12} color={colors.success} />
            <Text style={[styles.topRatedBadgeText, { color: colors.success }]}>
              Top Rated
            </Text>
          </View>
        )}
      </View>

      {trustScore.score >= 70 && (
        <View
          style={[
            styles.trustBadge,
            { backgroundColor: getTrustLevelColor(trustScore.level) + "15" },
          ]}
        >
          <Shield size={14} color={getTrustLevelColor(trustScore.level)} />
          <Text
            style={[
              styles.trustBadgeText,
              { color: getTrustLevelColor(trustScore.level) },
            ]}
          >
            Trust Score: {trustScore.score}%
          </Text>
          {verifiedCount > 0 && (
            <View style={styles.verificationCountBadge}>
              <CheckCircle2
                size={12}
                color={getTrustLevelColor(trustScore.level)}
              />
              <Text
                style={[
                  styles.verificationCountText,
                  { color: getTrustLevelColor(trustScore.level) },
                ]}
              >
                {verifiedCount} verified
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.contractorDetails}>
        <View style={styles.detailRow}>
          <View
            style={[styles.tradeBadge, { backgroundColor: colors.primary + "15" }]}
          >
            <Text style={[styles.tradeText, { color: colors.primary }]}>
              {trade}
            </Text>
          </View>
          <Text style={[styles.projectsText, { color: colors.textTertiary }]}>
            {completedProjects} projects
          </Text>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]}>
            {location}
          </Text>
        </View>
      </View>

      <View style={styles.contractorActions}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonSecondary,
              {
                backgroundColor: colors.primary + "10",
                borderColor: colors.primary,
              },
            ]}
            onPress={onPress}
          >
            <User size={16} color={colors.primary} />
            <Text
              style={[styles.actionButtonTextSecondary, { color: colors.primary }]}
            >
              View My Profile
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonSecondary,
                {
                  flex: 1,
                  backgroundColor: colors.primary + "10",
                  borderColor: colors.primary,
                },
              ]}
              onPress={() =>
                Alert.alert(
                  "Call",
                  (contractor as any).phone
                    ? `Calling ${(contractor as any).phone}`
                    : "Phone number not available"
                )
              }
            >
              <Phone size={16} color={colors.primary} />
              <Text
                style={[
                  styles.actionButtonTextSecondary,
                  { color: colors.primary },
                ]}
              >
                Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { flex: 1, backgroundColor: colors.primary },
              ]}
              onPress={onRequestEstimate}
            >
              <Calendar size={16} color={colors.white} />
              <Text style={[styles.actionButtonText, { color: colors.white }]}>
                Request
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ContractorsScreen() {
  const router = useRouter();
  const { user, colors } = useAuth();
  const { createAppointment } = useAppointments();
  const [apiContractors, setApiContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("All");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filters, setFilters] = useState({
    minRating: 0,
    location: "",
    verified: false,
    featured: false,
    topRated: false,
  });

  // Helper to map backend contractor to frontend type
  const mapContractor = (contractor: any): Contractor => {
    const userData = contractor.user || contractor.users || {};
    const firstName = userData.first_name || contractor.first_name || "";
    const lastName = userData.last_name || contractor.last_name || "";
    const fullName = firstName
      ? `${firstName} ${lastName}`.trim()
      : contractor.name || contractor.full_name || "Unknown";

    return {
      id: contractor.id || contractor.user_id || contractor.contractor_id,
      name: fullName,
      company:
        contractor.company_name ||
        contractor.company ||
        contractor.companyName ||
        "",
      trade:
        contractor.trade_specialization ||
        contractor.trade ||
        contractor.trade_type ||
        "All",
      location:
        userData.location || contractor.location || contractor.address || "",
      rating: contractor.rating || contractor.average_rating || 0,
      reviewCount: contractor.review_count || contractor.reviewCount || 0,
      verified:
        userData.verification_status === "verified" ||
        contractor.verified ||
        contractor.is_verified ||
        false,
      featured: contractor.featured || contractor.is_featured || false,
      topRated: contractor.top_rated || contractor.topRated || false,
      completedProjects:
        contractor.completed_projects || contractor.completedProjects || 0,
      verifications: contractor.verifications || [],
      phone: userData.phone || contractor.phone || "",
      email: userData.email || contractor.email || "",
    };
  };

  const fetchContractors = async (query?: string, isRefresh = false) => {
    if (!user) return;

    if (!isRefresh) setIsLoading(true);
    try {
      let response;
      if (query && query.trim()) {
        console.log("[API] GET /contractors/search", { query });
        response = await contractorsAPI.search(query);
      } else {
        console.log("[API] GET /contractors");
        response = await contractorsAPI.getAll();
      }

      if (response.success && response.data) {
        const rawList = Array.isArray(response.data)
          ? response.data
          : response.data.contractors || [];
        const mappedContractors = rawList.map(mapContractor);
        setApiContractors(mappedContractors);
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      if (!query) {
        Alert.alert(
          "Error",
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load contractors."
        );
      }
      setApiContractors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch contractors from API on mount or user change
  useEffect(() => {
    fetchContractors();
  }, [user]);

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (apiContractors.length === 0 && !isLoading) {
        fetchContractors();
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchContractors(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContractors(searchQuery, true);
    setRefreshing(false);
  };

  // Use API contractors only
  const contractors = apiContractors;

  const filteredContractors = contractors.filter((contractor) => {
    // Safely get contractor properties with fallbacks
    const name =
      contractor?.name || contractor?.full_name || contractor?.fullName || "";
    const company =
      contractor?.company ||
      contractor?.company_name ||
      contractor?.companyName ||
      "";
    const trade =
      contractor?.trade || contractor?.trade_type || contractor?.tradeType || "";
    const location = contractor?.location || contractor?.address || "";
    const rating =
      contractor?.rating ||
      contractor?.average_rating ||
      contractor?.averageRating ||
      0;
    const verified =
      contractor?.verified || contractor?.is_verified || contractor?.isVerified || false;
    const featured =
      contractor?.featured || contractor?.is_featured || contractor?.isFeatured || false;
    const topRated =
      contractor?.topRated || contractor?.top_rated || contractor?.isTopRated || false;

    // Safe search matching
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      (name && name.toLowerCase().includes(searchLower)) ||
      (company && company.toLowerCase().includes(searchLower)) ||
      (trade && trade.toLowerCase().includes(searchLower));

    const matchesTrade = selectedTrade === "All" || trade === selectedTrade;
    const matchesRating = rating >= filters.minRating;
    const matchesLocation =
      !filters.location ||
      (location && location.toLowerCase().includes(filters.location.toLowerCase()));
    const matchesVerified = !filters.verified || verified;
    const matchesFeatured = !filters.featured || featured;
    const matchesTopRated = !filters.topRated || topRated;

    return (
      matchesSearch &&
      matchesTrade &&
      matchesRating &&
      matchesLocation &&
      matchesVerified &&
      matchesFeatured &&
      matchesTopRated
    );
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Contractors",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
          headerRight: () => (
            <View
              style={{ flexDirection: "row" as const, gap: 12, marginRight: 8 }}
            >
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
              >
                {viewMode === "list" ? (
                  <MapIcon size={22} color={colors.primary} />
                ) : (
                  <ListIcon size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
                <Filter
                  size={22}
                  color={
                    filters.minRating > 0 ||
                    filters.location ||
                    filters.verified ||
                    filters.featured ||
                    filters.topRated
                      ? colors.primary
                      : colors.text
                  }
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View
        style={[
          styles.searchSection,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search contractors..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {TRADES.map((trade) => (
            <TouchableOpacity
              key={trade}
              style={[
                styles.filterChip,
                { backgroundColor: colors.background, borderColor: colors.border },
                selectedTrade === trade && [
                  styles.filterChipActive,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ],
              ]}
              onPress={() => setSelectedTrade(trade)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textSecondary },
                  selectedTrade === trade && [
                    styles.filterChipTextActive,
                    { color: colors.surface },
                  ],
                ]}
              >
                {trade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showFilters && (
          <View
            style={[styles.advancedFilters, { borderTopColor: colors.border }]}
          >
            <View style={styles.filterRow}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>
                Min Rating:
              </Text>
              <View style={styles.ratingFilters}>
                {[0, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingFilterChip,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      filters.minRating === rating && [
                        styles.ratingFilterChipActive,
                        { backgroundColor: colors.primary, borderColor: colors.primary },
                      ],
                    ]}
                    onPress={() => setFilters({ ...filters, minRating: rating })}
                  >
                    <Text
                      style={[
                        styles.ratingFilterText,
                        { color: colors.textSecondary },
                        filters.minRating === rating && [
                          styles.ratingFilterTextActive,
                          { color: colors.white },
                        ],
                      ]}
                    >
                      {rating === 0 ? "All" : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterRow}>
              <TextInput
                style={[
                  styles.locationInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Filter by location..."
                placeholderTextColor={colors.textSecondary}
                value={filters.location}
                onChangeText={(text) =>
                  setFilters({ ...filters, location: text })
                }
              />
            </View>

            <View style={styles.badgeFiltersRow}>
              <TouchableOpacity
                style={[
                  styles.badgeFilterChip,
                  { borderColor: colors.primary },
                  filters.verified && [
                    styles.badgeFilterChipActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() =>
                  setFilters({ ...filters, verified: !filters.verified })
                }
              >
                <BadgeCheck
                  size={14}
                  color={filters.verified ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.badgeFilterText,
                    { color: colors.primary },
                    filters.verified && [
                      styles.badgeFilterTextActive,
                      { color: colors.white },
                    ],
                  ]}
                >
                  Verified
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.badgeFilterChip,
                  { borderColor: colors.warning },
                  filters.featured && [
                    styles.badgeFilterChipActive,
                    { backgroundColor: colors.warning },
                  ],
                ]}
                onPress={() =>
                  setFilters({ ...filters, featured: !filters.featured })
                }
              >
                <Award
                  size={14}
                  color={filters.featured ? colors.white : colors.warning}
                />
                <Text
                  style={[
                    styles.badgeFilterText,
                    { color: colors.warning },
                    filters.featured && [
                      styles.badgeFilterTextActive,
                      { color: colors.white },
                    ],
                  ]}
                >
                  Featured
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.badgeFilterChip,
                  { borderColor: colors.success },
                  filters.topRated && [
                    styles.badgeFilterChipActive,
                    { backgroundColor: colors.success },
                  ],
                ]}
                onPress={() =>
                  setFilters({ ...filters, topRated: !filters.topRated })
                }
              >
                <TrendingUp
                  size={14}
                  color={filters.topRated ? colors.white : colors.success}
                />
                <Text
                  style={[
                    styles.badgeFilterText,
                    { color: colors.success },
                    filters.topRated && [
                      styles.badgeFilterTextActive,
                      { color: colors.white },
                    ],
                  ]}
                >
                  Top Rated
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {viewMode === "list" ? (
        <FlatList
          data={filteredContractors}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <ContractorCard
              contractor={item}
              isOwnProfile={item.id === user?.id}
              colors={colors}
              onPress={() => {
                router.push(`/contractor-profile?id=${item.id}`);
              }}
              onRequestEstimate={() => {
                setSelectedContractor(item);
                setShowRequestModal(true);
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Loading contractors...
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: colors.textSecondary },
                  ]}
                >
                  No contractors found
                </Text>
              </View>
            )
          }
        />
      ) : (
        <View
          style={[styles.mapContainer, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.mapPlaceholder, { color: colors.text }]}>
            Map View
          </Text>
          <Text style={[styles.mapSubtext, { color: colors.textSecondary }]}>
            Interactive map with contractor locations
          </Text>
          <Text style={[styles.mapNote, { color: colors.textTertiary }]}>
            Web: Use browser's geolocation API{"\n"}Mobile: Use react-native-maps
          </Text>
          <View style={styles.mapContractorsList}>
            <ScrollView contentContainerStyle={styles.mapContractorsContent}>
              {filteredContractors.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.mapContractorCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => router.push(`/contractor-profile?id=${item.id}`)}
                >
                  <View style={styles.mapContractorHeader}>
                    <Text
                      style={[styles.mapContractorName, { color: colors.text }]}
                    >
                      {item?.name ||
                        item?.full_name ||
                        item?.fullName ||
                        "Unknown"}
                    </Text>
                    {!!(item?.featured || item?.is_featured) && (
                      <Award size={14} color={colors.warning} />
                    )}
                    {!!(item?.topRated || item?.top_rated) && (
                      <TrendingUp size={14} color={colors.success} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.mapContractorTrade,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item?.trade || item?.trade_type || "All"}
                  </Text>
                  <View style={styles.mapContractorRating}>
                    <Star
                      size={12}
                      color={colors.warning}
                      fill={colors.warning}
                    />
                    <Text
                      style={[
                        styles.mapContractorRatingText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {((item?.rating || item?.average_rating || 0) as number).toFixed(
                        1
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <RequestEstimateModal
        visible={showRequestModal}
        contractor={selectedContractor}
        colors={colors}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedContractor(null);
        }}
        onSubmit={async (data) => {
          if (!user || !selectedContractor) return;

          try {
            await createAppointment({
              title: `Estimate Request - ${data.projectName}`,
              contractorId: selectedContractor.id,
              contractorName: selectedContractor.name,
              contractorCompany: selectedContractor.company,
              date: data.preferredDate,
              time: data.preferredTime,
              type: "estimate",
              location: data.location,
              notes: data.description,
            });

            Alert.alert(
              "Success",
              `Estimate request sent to ${selectedContractor.name}`,
              [{ text: "OK" }]
            );

            setShowRequestModal(false);
            setSelectedContractor(null);
          } catch (error) {
            console.error("Failed to create appointment:", error);
            Alert.alert("Error", "Failed to send estimate request");
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
  contractor: Contractor | null;
  onClose: () => void;
  onSubmit: (data: {
    projectName: string;
    location: string;
    description: string;
    preferredDate: string;
    preferredTime: string;
  }) => Promise<void>;
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

  if (!contractor) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.modalHeader,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Request Estimate
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View
            style={[
              styles.modalContractorInfo,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalContractorHeader}>
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {(() => {
                    const contractorName =
                      contractor?.name ||
                      contractor?.full_name ||
                      contractor?.fullName ||
                      "Unknown";
                    return (
                      contractorName
                        .split(" ")
                        .map((n) => n[0])
                        .filter(Boolean)
                        .join("")
                        .toUpperCase()
                        .substring(0, 2) || "?"
                    );
                  })()}
                </Text>
              </View>
              <View style={styles.modalContractorText}>
                <Text
                  style={[styles.modalContractorName, { color: colors.text }]}
                >
                  {contractor?.name ||
                    contractor?.full_name ||
                    contractor?.fullName ||
                    "Unknown"}
                </Text>
                {(contractor?.company || contractor?.company_name) && (
                  <Text
                    style={[
                      styles.modalContractorCompany,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {contractor?.company ||
                      contractor?.company_name ||
                      contractor?.companyName}
                  </Text>
                )}
                <Text
                  style={[styles.modalContractorTrade, { color: colors.primary }]}
                >
                  {contractor?.trade ||
                    contractor?.trade_type ||
                    contractor?.tradeType ||
                    "All"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Project Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
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
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Project address or location"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Project Description *
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
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
              <Text style={[styles.label, { color: colors.text }]}>
                Preferred Date
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                value={formData.preferredDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, preferredDate: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formGroupHalf}>
              <Text style={[styles.label, { color: colors.text }]}>
                Preferred Time
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filtersScroll: {
    marginHorizontal: -16,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipActive: {},
  filterChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  filterChipTextActive: {},
  listContent: {
    padding: 16,
  },
  contractorCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  contractorHeader: {
    flexDirection: "row" as const,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  contractorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 4,
  },
  contractorName: {
    fontSize: 18,
    fontWeight: "700" as const,
    flex: 1,
  },
  contractorCompany: {
    fontSize: 14,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  contractorDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  tradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tradeText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  projectsText: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  locationRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
  },
  contractorActions: {
    flexDirection: "row" as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonSecondary: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  actionButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
  },
  modalContractorInfo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  modalContractorHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  modalContractorText: {
    flex: 1,
  },
  modalContractorName: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  modalContractorCompany: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalContractorTrade: {
    fontSize: 13,
    fontWeight: "600" as const,
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
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
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
  },
  trustBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  trustBadgeText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  verificationCountBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginLeft: "auto" as const,
  },
  verificationCountText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  badgesContainer: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 12,
  },
  featuredBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  topRatedBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topRatedBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  advancedFilters: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  ratingFilters: {
    flexDirection: "row" as const,
    gap: 8,
  },
  ratingFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  ratingFilterChipActive: {},
  ratingFilterText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  ratingFilterTextActive: {},
  locationInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  badgeFiltersRow: {
    flexDirection: "row" as const,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  badgeFilterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeFilterChipActive: {},
  badgeFilterText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  badgeFilterTextActive: {},
  mapContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 16,
  },
  mapPlaceholder: {
    fontSize: 24,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 16,
    marginBottom: 4,
  },
  mapNote: {
    fontSize: 12,
    textAlign: "center" as const,
    marginBottom: 24,
  },
  mapContractorsList: {
    maxHeight: 300,
    width: "100%" as const,
  },
  mapContractorsContent: {
    gap: 12,
  },
  mapContractorCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  mapContractorHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 4,
  },
  mapContractorName: {
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
  },
  mapContractorTrade: {
    fontSize: 13,
    marginBottom: 4,
  },
  mapContractorRating: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  mapContractorRatingText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
});
