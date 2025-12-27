import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  DollarSign,
  X,
} from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/contexts/JobsContext";

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
};
import { Job, JobUrgency } from "@/types";
import { TRADES } from "@/constants/trades";
import { jobsAPI } from "@/services/api";

export default function JobsScreen() {
  const router = useRouter();
  const { user, colors } = useAuth();
  const { jobs: contextJobs, createJob: contextCreateJob, isLoading: contextLoading, refreshJobs: contextRefresh } = useJobs();
  const [apiJobs, setApiJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("All");
  const [showPostModal, setShowPostModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch jobs from API
  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (!user) return;

    // Only show full loading spinner on initial load, not refresh
    if (!isRefresh) setIsLoading(true);
    setError(null);
    try {
      // Also refresh context if available
      if (contextRefresh && typeof contextRefresh === 'function') {
        contextRefresh();
      }

      console.log("[API] GET /jobs");
      const response = await jobsAPI.getAll();

      if (response.success && response.data) {
        // Backend returns {jobs: [...], total, page, pages} - need to access .jobs
        const jobsArray = response.data.jobs || response.data;
        const mappedJobs = Array.isArray(jobsArray) ? jobsArray.map((job: any) => ({
          id: job.id || job.job_id,
          title: job.title || job.job_title,
          description: job.descriptions || job.description || '', // FIXED: Backend uses 'descriptions' (plural)
          trade: job.trade_type || job.trade || "All",
          location: job.locations || job.location || '',
          status: job.status || "open",
          urgency: (job.urgency || "medium") as JobUrgency,
          startDate: job.start_date || job.startDate,
          endDate: job.end_date || job.endDate,
          budget: job.budget_min ? `$${job.budget_min}` : undefined,
          payRate: job.pay_rate || job.payRate,
          postedBy: job.posted_by || job.postedBy || user?.id || '',
          postedByName: job.posted_by_name || job.postedByName || user?.fullName || '',
          postedByCompany: job.posted_by_company || job.postedByCompany || user?.company || '',
          applicationsCount: job.applications_count || job.applicationsCount || 0,
          createdAt: job.created_at || job.createdAt,
          updatedAt: job.updated_at || job.updatedAt,
          requirements: job.requirements || [],
        })) : [];
        setApiJobs(mappedJobs);
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch jobs:", error);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, contextRefresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [user]); // fetchJobs dependency removed to prevent loop if refreshing state changes? No, useCallback handles it. But stick to [user].

  // Use API jobs only
  const jobs = apiJobs;

  // Visible for PM only (hide for VIEWER), Admin sees everything
  const isAdmin = user?.role === "ADMIN";
  const canPostJobs = user?.role === "PM" || isAdmin;

  // Search jobs via API when search query is provided
  useEffect(() => {
    const searchJobs = async () => {
      if (!user || !searchQuery.trim()) return;

      try {
        console.log("[API] GET /jobs/search", { query: searchQuery });
        const response = await jobsAPI.search(searchQuery);

        if (response.success && response.data) {
          const mappedJobs = Array.isArray(response.data) ? response.data.map((job: any) => ({
            id: job.id || job.job_id,
            title: job.title || job.job_title,
            description: job.description,
            trade: job.trade || job.category || "All",
            location: job.locations || job.location || '',
            status: job.status || "open",
            urgency: (job.urgency || "medium") as JobUrgency,
            startDate: job.start_date || job.startDate,
            endDate: job.end_date || job.endDate,
            budget: job.budget,
            payRate: job.pay_rate || job.payRate,
            postedBy: job.posted_by || job.postedBy || user.id,
            postedByName: job.posted_by_name || job.postedByName || user.fullName,
            postedByCompany: job.posted_by_company || job.postedByCompany || user.company,
            applicationsCount: job.applications_count || job.applicationsCount || 0,
            createdAt: job.created_at || job.createdAt,
            updatedAt: job.updated_at || job.updatedAt,
          })) : [];
          setApiJobs(mappedJobs);
        }
      } catch (error: any) {
        console.error("[API] Search failed:", error);
        // Fallback to local filtering
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchJobs();
      } else {
        // If search is cleared, reload all jobs
        fetchJobs();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // If we have a search query, API search should have handled it
      // Otherwise, do local filtering
      if (searchQuery.trim()) {
        return true; // API search results
      }
      const matchesTrade =
        selectedTrade === "All" || job.trade === selectedTrade;
      return matchesTrade;
    });
  }, [jobs, searchQuery, selectedTrade]);

  const renderJobCard = ({ item }: { item: Job }) => {
    const urgencyColors: Record<JobUrgency, string> = {
      low: colors.success,
      medium: colors.warning,
      high: colors.secondary,
      urgent: colors.error,
    };

    return (
      <TouchableOpacity
        style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          console.log('Navigating to job details from jobs page:', item.id, item.title);
          router.push(`/job-details?id=${item.id}`);
        }}
      >
        <View style={styles.jobHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.jobTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.jobCompany, { color: colors.textSecondary }]}>{item.postedByCompany}</Text>
          </View>
          <View
            style={[
              styles.urgencyBadge,
              { backgroundColor: urgencyColors[item.urgency] },
            ]}
          >
            <Text style={[styles.urgencyText, { color: colors.white }]}>
              {item.urgency.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.jobDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.jobDetails}>
          <View style={styles.detailItem}>
            <Briefcase size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.trade}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.location}</Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          {item.payRate && (
            <View style={styles.detailItem}>
              <DollarSign size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.payRate}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Starts {new Date(item.startDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <Text style={[styles.applicationsCount, { color: colors.primary }]}>
            {item.applicationsCount} application
            {item.applicationsCount !== 1 ? "s" : ""}
          </Text>
          <Text style={[styles.postedTime, { color: colors.textTertiary }]}>
            Posted {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Jobs & Gigs",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () =>
            // Visible for PM only
            canPostJobs ? (
              <TouchableOpacity
                onPress={() => setShowPostModal(true)}
                style={styles.headerButton}
              >
                <Plus size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search jobs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {["All", ...TRADES.filter((t) => t !== "All")].map((trade) => (
            <TouchableOpacity
              key={trade}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedTrade === trade && [styles.filterChipActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              ]}
              onPress={() => setSelectedTrade(trade)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textSecondary },
                  selectedTrade === trade && [styles.filterChipTextActive, { color: colors.white }],
                ]}
              >
                {trade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading && !refreshing ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Loading jobs...</Text>
          </View>
        ) : filteredJobs.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
          >
            <View style={styles.emptyState}>
              <Briefcase size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No jobs found</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                {searchQuery || selectedTrade !== "All"
                  ? "Try adjusting your filters"
                  : canPostJobs
                    ? "Be the first to post a job!"
                    : "Check back later for new opportunities"}
              </Text>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={filteredJobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.jobsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
          />
        )}
      </View>

      <PostJobModal
        visible={showPostModal}
        onClose={() => setShowPostModal(false)}
        colors={colors}
        onSubmit={async (jobData: any) => {
          if (!user) return;

          try {
            setIsLoading(true);
            console.log("[API] POST /jobs", jobData);

            // Map frontend job format to backend format  
            // Backend expects: trade_type, budget_min, budget_max
            const backendData = {
              title: jobData.title,
              description: jobData.description,
              trade_type: jobData.trade, // Changed from 'trade' to 'trade_type'
              location: jobData.location,
              start_date: jobData.startDate,
              end_date: jobData.endDate || null,
              // Parse budget string to numbers
              budget_min: jobData.budget ? parseInt(jobData.budget.replace(/[^0-9]/g, '')) : null,
              budget_max: jobData.budget ? parseInt(jobData.budget.replace(/[^0-9]/g, '')) : null,
              pay_rate: jobData.pay_rate || null, // FIX: Consistency with formData key in PostJobModal
              urgency: jobData.urgency,
              status: jobData.status || "open",
              requirements: jobData.requirements || {},  // Changed from array to object
            };

            console.log("[API] Mapped backend payload:", backendData);
            const response = await jobsAPI.create(backendData);

            if (response.success) {
              Alert.alert("Success", "Job posted successfully!");
              setShowPostModal(false);
              // Refresh jobs list
              fetchJobs();
            } else {
              Alert.alert("Error", response.message || "Failed to post job");
            }
          } catch (error: any) {
            console.error("[API] Failed to create job:", error);
            Alert.alert("Error", error.response?.data?.message || error.message || "Failed to post job. Please try again.");
          } finally {
            setIsLoading(false);
          }
        }}
      />
    </View>
  );
}

function PostJobModal({
  visible,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  colors: any;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    trade: "Electrical",
    location: "Los Angeles, CA",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    budget: "",
    payRate: "",
    urgency: "medium" as JobUrgency,
    requirements: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showTradePicker, setShowTradePicker] = useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        status: "open",
        requirements: {}, // Backend expects object, not array
      });
      setFormData({
        title: "",
        description: "",
        trade: "Electrical",
        location: "Los Angeles, CA",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        budget: "",
        payRate: "",
        urgency: "medium",
        requirements: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Post New Job</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Job Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., Senior Electrician Needed"
              value={formData.title}
              onChangeText={(text) =>
                setFormData({ ...formData, title: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe the job requirements and responsibilities..."
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Trade *</Text>
              <TouchableOpacity
                style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowTradePicker(true)}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>{formData.trade}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Urgency</Text>
              <TouchableOpacity
                style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowUrgencyPicker(true)}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {formData.urgency.charAt(0).toUpperCase() +
                    formData.urgency.slice(1)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="City, State"
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                value={formData.startDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, startDate: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>End Date (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                value={formData.endDate}
                onChangeText={(text) =>
                  setFormData({ ...formData, endDate: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Budget (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., $50,000"
                value={formData.budget}
                onChangeText={(text) =>
                  setFormData({ ...formData, budget: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Pay Rate (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., $50/hour"
                value={formData.payRate}
                onChangeText={(text) =>
                  setFormData({ ...formData, payRate: text })
                }
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Requirements (one per line)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Valid license&#10;5+ years experience&#10;Own tools"
              value={formData.requirements}
              onChangeText={(text) =>
                setFormData({ ...formData, requirements: text })
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
            disabled={submitting || !formData.title || !formData.description}
          >
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Posting..." : "Post Job"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal
        visible={showTradePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTradePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowTradePicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
            <View style={[styles.pickerHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Trade</Text>
              <TouchableOpacity onPress={() => setShowTradePicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {TRADES.filter((t) => t !== "All").map((trade) => (
                <TouchableOpacity
                  key={trade}
                  style={[
                    styles.pickerItem,
                    formData.trade === trade && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, trade });
                    setShowTradePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: colors.text },
                      formData.trade === trade && [styles.pickerItemTextActive, { color: colors.primary }],
                    ]}
                  >
                    {trade}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showUrgencyPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUrgencyPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowUrgencyPicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
            <View style={[styles.pickerHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Urgency</Text>
              <TouchableOpacity onPress={() => setShowUrgencyPicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {["low", "medium", "high", "urgent"].map((urgency) => (
                <TouchableOpacity
                  key={urgency}
                  style={[
                    styles.pickerItem,
                    formData.urgency === urgency && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, urgency: urgency as JobUrgency });
                    setShowUrgencyPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      { color: colors.text },
                      formData.urgency === urgency && [styles.pickerItemTextActive, { color: colors.primary }],
                    ]}
                  >
                    {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: staticColors.text,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: staticColors.surface,
    borderWidth: 1,
    borderColor: staticColors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: staticColors.primary,
    borderColor: staticColors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: staticColors.textSecondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: staticColors.white,
  },
  jobsList: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: staticColors.text,
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: "700",
    color: staticColors.white,
  },
  jobDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  jobDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
  },
  applicationsCount: {
    fontSize: 12,
    color: staticColors.primary,
    fontWeight: "500",
  },
  postedTime: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: staticColors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: staticColors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
    backgroundColor: staticColors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: staticColors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: staticColors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: staticColors.surface,
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: staticColors.text,
  },
  textArea: {
    height: 100,
  },
  pickerContainer: {
    backgroundColor: staticColors.surface,
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: staticColors.text,
  },
  submitButton: {
    backgroundColor: staticColors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: staticColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: staticColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: staticColors.text,
  },
  pickerList: {
    padding: 16,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  pickerItemActive: {
    backgroundColor: staticColors.primary + "10",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  pickerItemText: {
    fontSize: 16,
    color: staticColors.text,
  },
  pickerItemTextActive: {
    color: staticColors.primary,
    fontWeight: "600",
  },
});
