import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
  Building,
  Phone,
  X,
  UserPlus,
  Clock,
  AlertCircle,
  Trash2,
  Send,
} from "lucide-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/contexts/JobsContext";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { JobApplication } from "@/types";
import { jobsAPI, contractorsAPI } from "@/services/api";

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

export default function JobDetailsScreen() {
  const { colors } = useAuth();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const jobId = Array.isArray(id) ? id[0] : id;
  console.log('Job Details Screen - Raw ID:', id, 'Processed ID:', jobId, 'Type:', typeof jobId);

  const {
    getJobById,
    getApplicationsByJobId,
    applyToJob: contextApplyToJob,
    updateApplicationStatus: contextUpdateApplicationStatus,
    sendMessage,
    deleteJob,
  } = useJobs();

  const jobs = useJobs().jobs;

  const { requestEstimate, createAppointment } = useAppointments();

  const [apiJob, setApiJob] = useState<any>(null);
  const [apiApplications, setApiApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRequestEstimateModal, setShowRequestEstimateModal] = useState(false);
  const [showBookAppointmentModal, setShowBookAppointmentModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'applicants'>('details');

  // Fetch job details from API
  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchApplications();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      console.log("[API] GET /jobs/:id", jobId);
      const response = await jobsAPI.getById(jobId);

      if (response.success && response.data) {
        const d = response.data;
        // Map backend fields to frontend UI names
        const mappedJob = {
          ...d,
          trade: d.trade_type || d.trade || "General",
          postedByName: d.project_manager ? `${d.project_manager.first_name} ${d.project_manager.last_name}` : "System User",
          postedByCompany: d.project_manager?.company || "Professional Services",
          postedBy: d.projects_manager_id || d.postedBy,
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          startDate: d.start_date || d.start_date_range || d.startDate || null,
          timeline: d.timeline,
          description: d.description || d.descriptions || "",
        };
        setApiJob(mappedJob);
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      // Fallback to context
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!jobId || !user) return;

    // Allow all users to fetch applications (backend now filters correctly)

    try {
      console.log("[API] GET /jobs/:jobId/applications", jobId);
      const response = await jobsAPI.getApplications(jobId);

      if (response.success && response.data) {
        const mappedApplications = Array.isArray(response.data) ? response.data.map((app: any) => ({
          id: app.id || app.application_id,
          jobId: app.job_id || app.jobId,
          applicantId: app.contractor_id || app.applicant_id || app.applicantId,
          applicantName: app.contractor ? `${app.contractor.first_name} ${app.contractor.last_name}` : (app.applicant_name || app.applicantName || "Contractor"),
          applicantCompany: app.contractor?.company || app.applicantCompany || "",
          status: app.status || "pending",
          appliedAt: app.applied_at || app.appliedAt,
          coverLetter: app.cover_letter || app.coverLetter,
          proposedRate: app.proposed_rate || app.proposedRate,
          availableFrom: app.available_from || app.availableFrom,
        })) : [];
        setApiApplications(mappedApplications);
      }
    } catch (error: any) {
      console.log("[API ERROR]", error);
      // Fallback to context
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchJobDetails(), fetchApplications()]);
    setRefreshing(false);
  };

  // Use API data if available, otherwise fallback to context
  const job = apiJob || getJobById(jobId as string);
  const applications = apiApplications.length > 0 ? apiApplications : getApplicationsByJobId(jobId as string);

  console.log('Job Details - Found job:', job ? job.title : 'NOT FOUND', 'All jobs count:', jobs?.length);
  // Visible for PM only (hide for VIEWER), Admin sees everything
  const isAdmin = user?.role === "ADMIN";
  const canManage = user?.role === "PM" || isAdmin;
  const isJobPoster = user?.id === job?.postedBy;
  const hasApplied = applications.some((app) => app.applicantId === user?.id);
  const userApplication = applications.find((app) => app.applicantId === user?.id);
  const canApply = !isJobPoster && job?.status === "open" && !hasApplied;
  // Visible for SUB/TS only (not GC, not PM, not VIEWER)
  const canViewApplyButton = user?.role === "SUB" || user?.role === "TS";

  if (isLoading && !job) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Job Details",
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading job details...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Job Details",
            headerShown: true,
          }}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Job not found</Text>
        </View>
      </View>
    );
  }

  const urgencyColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.secondary,
    urgent: colors.error,
  };

  const handleDeleteJob = () => {
    if (!job) return;
    deleteJob(job.id);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: job.title,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () =>
            // Visible for PM only (job poster, hide for VIEWER)
            (isJobPoster && user?.role === "PM") ? (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowInviteModal(true)}
                >
                  <UserPlus size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleDeleteJob}
                >
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : null,
        }}
      />

      {(isJobPoster || canManage) && (
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'details' && [styles.tabTextActive, { color: colors.primary }]]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'applicants' && [styles.tabActive, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('applicants')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'applicants' && [styles.tabTextActive, { color: colors.primary }]]}>
              Applicants ({applications.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {activeTab === 'details' && (
          <>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: urgencyColors[(job.urgency as keyof typeof urgencyColors) || 'medium'] },
                  ]}
                >
                  <Text style={[styles.urgencyText, { color: colors.white }]}>
                    {job.urgency?.toUpperCase() || 'MEDIUM'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.company, { color: colors.textSecondary }]}>{job.postedByCompany}</Text>
              <Text style={[styles.postedBy, { color: colors.textTertiary }]}>Posted by {job.postedByName}</Text>
              <Text style={[styles.postedDate, { color: colors.textTertiary }]}>
                Posted on {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently"}
              </Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Briefcase size={20} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Trade</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{job.trade}</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MapPin size={20} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Location</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{job.location}</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Calendar size={20} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Start Date</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {job.startDate ? new Date(job.startDate).toLocaleDateString() : (job.timeline || "Not specified")}
                </Text>
              </View>

              {!!job.payRate && (
                <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <DollarSign size={20} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Pay Rate</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{job.payRate}</Text>
                </View>
              )}

              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <User size={20} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Applicants</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{applications.length}</Text>
              </View>

              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Clock size={20} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Status</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {job.status?.replace('_', ' ').toUpperCase() || 'OPEN'}
                </Text>
              </View>
            </View>

            {!!job.budget && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget</Text>
                <Text style={[styles.budget, { color: colors.primary }]}>{job.budget}</Text>
              </View>
            )}

            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{job.description}</Text>
            </View>

            {job.requirements.length > 0 && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirements</Text>
                {job.requirements.map((req: string, index: number) => (
                  <View key={index} style={styles.requirementItem}>
                    <View style={[styles.requirementBullet, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.requirementText, { color: colors.text }]}>{req}</Text>
                  </View>
                ))}
              </View>
            )}

            {job.status === "open" && !isJobPoster && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  style={[styles.bookAppointmentCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}
                  onPress={() => setShowBookAppointmentModal(true)}
                >
                  <Calendar size={32} color={colors.primary} />
                  <View style={styles.bookAppointmentContent}>
                    <Text style={[styles.bookAppointmentTitle, { color: colors.text }]}>Book Estimate Appointment</Text>
                    <Text style={[styles.bookAppointmentText, { color: colors.textSecondary }]}>
                      Schedule a site visit to discuss this job and get an estimate
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {(isJobPoster || canManage) && user?.role !== "VIEWER" && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: colors.primary }]}
                    onPress={() => setShowInviteModal(true)}
                  >
                    <UserPlus size={24} color={colors.white} />
                    <Text style={[styles.actionCardText, { color: colors.white }]}>Invite Users</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionCard, { backgroundColor: colors.secondary }]}
                    onPress={() => setActiveTab('applicants')}
                  >
                    <User size={24} color={colors.white} />
                    <Text style={[styles.actionCardText, { color: colors.white }]}>View Applicants</Text>
                    <Text style={[styles.actionCardCount, { color: colors.white }]}>{applications.length}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === 'applicants' && (
          <View style={styles.applicantsContainer}>
            {applications.length === 0 ? (
              <View style={styles.emptyApplicants}>
                <AlertCircle size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyApplicantsTitle, { color: colors.text }]}>No Applications Yet</Text>
                <Text style={[styles.emptyApplicantsText, { color: colors.textSecondary }]}>
                  No one has applied to this job yet. Invite contractors to apply.
                </Text>
                <TouchableOpacity
                  style={[styles.inviteButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowInviteModal(true)}
                >
                  <UserPlus size={20} color={colors.white} />
                  <Text style={[styles.inviteButtonText, { color: colors.white }]}>Invite Contractors</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.applicantsList}>
                <View style={styles.applicantsHeader}>
                  <Text style={[styles.applicantsTitle, { color: colors.text }]}>All Applicants</Text>
                  <View style={styles.statusCounts}>
                    <View style={styles.statusCount}>
                      <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                      <Text style={[styles.statusCountText, { color: colors.textSecondary }]}>
                        {applications.filter(a => a.status === 'pending').length} Pending
                      </Text>
                    </View>
                    <View style={styles.statusCount}>
                      <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                      <Text style={[styles.statusCountText, { color: colors.textSecondary }]}>
                        {applications.filter(a => a.status === 'accepted').length} Accepted
                      </Text>
                    </View>
                    <View style={styles.statusCount}>
                      <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                      <Text style={[styles.statusCountText, { color: colors.textSecondary }]}>
                        {applications.filter(a => a.status === 'rejected').length} Declined
                      </Text>
                    </View>
                  </View>
                </View>
                {applications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onAccept={async () => {
                      try {
                        setIsUpdatingStatus(true);
                        console.log("[API] PUT /jobs/applications/:applicationId/status", application.id, "accepted");
                        const response = await jobsAPI.updateApplicationStatus(application.id, "accepted");

                        if (response.success) {
                          Alert.alert("Success", "Application accepted");
                          // Refresh applications list
                          await fetchApplications();
                        } else {
                          Alert.alert("Error", response.message || "Failed to update application status");
                        }
                      } catch (error: any) {
                        console.log("[API ERROR]", error);
                        Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
                        // Fallback to context
                        contextUpdateApplicationStatus(application.id, "accepted");
                        await fetchApplications();
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }}
                    onReject={async () => {
                      try {
                        setIsUpdatingStatus(true);
                        console.log("[API] PUT /jobs/applications/:applicationId/status", application.id, "rejected");
                        const response = await jobsAPI.updateApplicationStatus(application.id, "rejected");

                        if (response.success) {
                          Alert.alert("Success", "Application declined");
                          // Refresh applications list
                          await fetchApplications();
                        } else {
                          Alert.alert("Error", response.message || "Failed to update application status");
                        }
                      } catch (error: any) {
                        console.log("[API ERROR]", error);
                        Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
                        // Fallback to context
                        contextUpdateApplicationStatus(application.id, "rejected");
                        await fetchApplications();
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }}
                    onMessage={() => {
                      setSelectedApplication(application);
                      setShowMessageModal(true);
                    }}
                    colors={colors}
                    router={router}
                    jobId={jobId}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {canApply && canViewApplyButton && user?.role !== "VIEWER" && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowApplyModal(true)}
            >
              <Text style={[styles.applyButtonText, { color: colors.white }]}>Apply Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bookAppointmentButtonFooter, { backgroundColor: colors.surface, borderColor: colors.primary }]}
              onPress={() => setShowBookAppointmentModal(true)}
            >
              <Calendar size={18} color={colors.primary} />
              <Text style={[styles.bookAppointmentButtonText, { color: colors.primary }]}>Book Estimate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {hasApplied && !isJobPoster && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.appliedSection}>
            <View style={styles.appliedBanner}>
              <CheckCircle size={20} color={colors.success} />
              <Text style={[styles.appliedText, { color: colors.success }]}>You have applied to this job</Text>
            </View>
            <TouchableOpacity
              style={[styles.requestEstimateButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowRequestEstimateModal(true)}
            >
              <Calendar size={18} color={colors.white} />
              <Text style={[styles.requestEstimateText, { color: colors.white }]}>Request Estimate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      <MessageModal
        visible={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedApplication(null);
        }}
        onSend={async (message) => {
          if (selectedApplication && user) {
            await sendMessage(
              job.id,
              selectedApplication.applicantId,
              message,
              selectedApplication.id
            );
            setShowMessageModal(false);
            setSelectedApplication(null);
          }
        }}
        recipientName={selectedApplication?.applicantName || ""}
        colors={colors}
      />

      <RequestEstimateModal
        visible={showRequestEstimateModal}
        onClose={() => setShowRequestEstimateModal(false)}
        onSubmit={async (data) => {
          if (!user || !userApplication) return;
          await requestEstimate({
            jobId: job.id,
            applicationId: userApplication.id,
            requestedFrom: job.postedBy,
            requestedFromName: job.postedByName,
            location: data.location,
            description: data.description,
            preferredDate: data.preferredDate,
            preferredTime: data.preferredTime,
          });
          setShowRequestEstimateModal(false);
        }}
        jobTitle={job.title}
        defaultLocation={job.location}
        colors={colors}
      />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        jobId={job.id}
        jobTitle={job.title}
        existingApplicants={applications.map(a => a.applicantId)}
        colors={colors}
      />

      <BookAppointmentModal
        visible={showBookAppointmentModal}
        onClose={() => setShowBookAppointmentModal(false)}
        onSubmit={async (data) => {
          if (!user) return;
          await createAppointment({
            title: `Estimate for ${job.title}`,
            contractorId: job.postedBy,
            contractorName: job.postedByName,
            contractorCompany: job.postedByCompany,
            date: data.date,
            time: data.time,
            type: "estimate",
            location: data.location,
            notes: data.notes,
            jobId: job.id,
            entityType: 'job', // Specify this is a Job
          });
          setShowBookAppointmentModal(false);
        }}
        jobTitle={job.title}
        defaultLocation={job.location}
        jobPoster={job.postedByName}
        colors={colors}
      />
    </View>
  );
}

function ApplicationCard({
  application,
  onAccept,
  onReject,
  onMessage,
  colors,
  router,
  jobId,
}: {
  application: JobApplication;
  onAccept: () => void;
  onReject: () => void;
  onMessage: () => void;
  colors: any;
  router: any;
  jobId: string;
}) {
  const statusColors = {
    pending: colors.warning,
    accepted: colors.success,
    rejected: colors.error,
    withdrawn: colors.textTertiary,
  };

  const statusText = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Declined",
    withdrawn: "Withdrawn",
  };

  return (
    <View style={[styles.applicationCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.applicantHeader}>
        <View style={styles.applicantInfo}>
          <View style={styles.applicantRow}>
            <User size={16} color={colors.textSecondary} />
            <Text style={[styles.applicantName, { color: colors.text }]}>{application.applicantName}</Text>
          </View>
          <View style={styles.applicantRow}>
            <Building size={16} color={colors.textSecondary} />
            <Text style={[styles.applicantDetail, { color: colors.textSecondary }]}>
              {application.applicantCompany}
            </Text>
          </View>
          <View style={styles.applicantRow}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={[styles.applicantDetail, { color: colors.textSecondary }]}>
              {application.applicantPhone}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[application.status] },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.white }]}>{statusText[application.status]}</Text>
        </View>
      </View>

      <Text style={[styles.coverLetterLabel, { color: colors.textSecondary }]}>Cover Letter:</Text>
      <Text style={[styles.coverLetterText, { color: colors.text }]}>{application.coverLetter}</Text>

      {!!application.proposedRate && (
        <View style={styles.proposedRateContainer}>
          <DollarSign size={16} color={colors.primary} />
          <Text style={[styles.proposedRateText, { color: colors.primary }]}>
            Proposed Rate: {application.proposedRate}
          </Text>
        </View>
      )}

      <View style={[styles.applicationMeta, { borderTopColor: colors.border }]}>
        <Text style={[styles.applicationDate, { color: colors.textTertiary }]}>
          Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Recently'}
        </Text>
        <Text style={[styles.availableFrom, { color: colors.textTertiary }]}>
          Available from{" "}
          {application.availableFrom ? new Date(application.availableFrom).toLocaleDateString() : 'TBD'}
        </Text>
      </View>

      {application.status === "pending" && (
        <View style={styles.applicationActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
            onPress={onAccept}
          >
            <CheckCircle size={18} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.error }]}
            onPress={onReject}
          >
            <XCircle size={18} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton, { backgroundColor: colors.primary }]}
            onPress={onMessage}
          >
            <MessageCircle size={18} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>Message</Text>
          </TouchableOpacity>
        </View>
      )}

      {application.status !== "pending" && (
        <View style={{ gap: 10 }}>
          {application.status === "accepted" && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success, marginTop: 12 }]}
              onPress={() => router.push({
                pathname: "/project-setup",
                params: {
                  bidId: jobId,
                  submissionId: application.id
                }
              } as any)}
            >
              <CheckCircle size={18} color={colors.white} />
              <Text style={[styles.actionButtonText, { color: colors.white }]}>Initialize Project</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton, { backgroundColor: colors.primary }]}
            onPress={onMessage}
          >
            <MessageCircle size={18} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>Send Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ApplyModal({
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
    coverLetter: "",
    proposedRate: "",
    availableFrom: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.coverLetter) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        coverLetter: "",
        proposedRate: "",
        availableFrom: new Date().toISOString().split("T")[0],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Apply to Job</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Cover Letter *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Tell them why you're a great fit for this job..."
              value={formData.coverLetter}
              onChangeText={(text) =>
                setFormData({ ...formData, coverLetter: text })
              }
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Proposed Rate (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., $50/hour or $5,000 total"
              value={formData.proposedRate}
              onChangeText={(text) =>
                setFormData({ ...formData, proposedRate: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Available From</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="YYYY-MM-DD"
              value={formData.availableFrom}
              onChangeText={(text) =>
                setFormData({ ...formData, availableFrom: text })
              }
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
            disabled={submitting || !formData.coverLetter}
          >
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function MessageModal({
  visible,
  onClose,
  onSend,
  recipientName,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  recipientName: string;
  colors: any;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      await onSend(message);
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Message {recipientName}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.messageModalContent}>
          <TextInput
            style={[styles.input, styles.messageTextArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, sending && styles.submitButtonDisabled]}
            onPress={handleSend}
            disabled={sending || !message.trim()}
          >
            <MessageCircle size={20} color={colors.white} />
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {sending ? "Sending..." : "Send Message"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function RequestEstimateModal({
  visible,
  onClose,
  onSubmit,
  jobTitle,
  defaultLocation,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  jobTitle: string;
  defaultLocation: string;
  colors: any;
}) {
  const [formData, setFormData] = useState({
    location: defaultLocation,
    description: "",
    preferredDate: "",
    preferredTime: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.location || !formData.description) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        location: defaultLocation,
        description: "",
        preferredDate: "",
        preferredTime: "",
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
          <View style={[styles.estimateJobInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.estimateJobLabel, { color: colors.textTertiary }]}>For Job:</Text>
            <Text style={[styles.estimateJobTitle, { color: colors.text }]}>{jobTitle}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Site location for estimate"
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe what needs to be estimated..."
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

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Preferred Date (Optional)</Text>
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

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Preferred Time (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 10:00 AM"
              value={formData.preferredTime}
              onChangeText={(text) =>
                setFormData({ ...formData, preferredTime: text })
              }
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
            disabled={submitting || !formData.location || !formData.description}
          >
            <Calendar size={20} color={colors.white} />
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Requesting..." : "Send Request"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function BookAppointmentModal({
  visible,
  onClose,
  onSubmit,
  jobTitle,
  defaultLocation,
  jobPoster,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  jobTitle: string;
  defaultLocation: string;
  jobPoster: string;
  colors: any;
}) {
  const [formData, setFormData] = useState({
    location: defaultLocation,
    date: "",
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.location || !formData.date || !formData.time) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        location: defaultLocation,
        date: "",
        time: "",
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>Book Estimate Appointment</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentInner}
        >
          <View style={[styles.estimateJobInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.estimateJobLabel, { color: colors.textTertiary }]}>For Job:</Text>
            <Text style={[styles.estimateJobTitle, { color: colors.text }]}>{jobTitle}</Text>
            <Text style={[styles.estimateJobSubtitle, { color: colors.textSecondary }]}>Meeting with: {jobPoster}</Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Calendar size={20} color={colors.primary} />
            <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
              Book an appointment to visit the site and provide an estimate. The job poster will be notified.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Site location for estimate"
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(text) =>
                setFormData({ ...formData, date: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Time *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g., 10:00 AM"
              value={formData.time}
              onChangeText={(text) =>
                setFormData({ ...formData, time: text })
              }
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Any specific details or questions..."
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
            disabled={submitting || !formData.location || !formData.date || !formData.time}
          >
            <Calendar size={20} color={colors.white} />
            <Text style={[styles.submitButtonText, { color: colors.white }]}>
              {submitting ? "Booking..." : "Book Appointment"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function InviteModal({
  visible,
  onClose,
  jobId,
  jobTitle,
  existingApplicants,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  existingApplicants: string[];
  colors: any;
}) {
  const { user } = useAuth();
  const { inviteContractor, addNotification } = useJobs();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAvailableContractors();
    }
  }, [visible]);

  const fetchAvailableContractors = async () => {
    try {
      setLoadingUsers(true);
      console.log("[API] GET /contractors (for invite)");
      const response = await contractorsAPI.getAll();
      console.log("[InviteModal] API Response success:", response?.success);
      const contractorsData = response?.data?.contractors || response?.data || response || [];
      const contractorsArray = Array.isArray(contractorsData) ? contractorsData : [];
      console.log("[InviteModal] Raw contractors count:", contractorsArray.length);
      if (contractorsArray.length > 0) {
        console.log("[InviteModal] First contractor role/id:", contractorsArray[0].role, contractorsArray[0].id);
      }

      const filtered = contractorsArray.filter(
        (c: any) => {
          const role = (c.role || "").toLowerCase();
          const isContractorRole = role.includes("contractor") ||
            role.includes("sub") ||
            role.includes("special") ||
            role === "ts";

          return c.id !== user?.id &&
            (!existingApplicants.includes(c.id)) &&
            isContractorRole &&
            (searchQuery === "" ||
              (c.fullName || c.full_name || c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
              (c.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
              (c.last_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
              (c.company || c.companyName || c.company_name || "").toLowerCase().includes(searchQuery.toLowerCase()));
        }
      );
      setAvailableUsers(filtered);
    } catch (error: any) {
      console.log("[API ERROR]", error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (visible && searchQuery) {
      fetchAvailableContractors();
    }
  }, [searchQuery]);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0 || !user) return;

    setSending(true);
    try {
      for (const userId of selectedUsers) {
        await inviteContractor(jobId, userId, `Hi, I'd like to invite you to apply for my job: ${jobTitle}`);
      }
      Alert.alert("Success", `Invited ${selectedUsers.length} contractor(s) to apply`);
      setSelectedUsers([]);
      setSearchQuery("");
      onClose();
    } catch (error: any) {
      console.log("[API ERROR]", error);
      Alert.alert("Error", error?.message || "Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Invite Users to Apply</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inviteModalContent}>
          <View style={[styles.inviteJobInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.inviteJobLabel, { color: colors.textTertiary }]}>For Job:</Text>
            <Text style={[styles.inviteJobTitle, { color: colors.text }]}>{jobTitle}</Text>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Search contractors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {selectedUsers.length > 0 && (
            <View style={[styles.selectedCount, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.selectedCountText, { color: colors.primary }]}>
                {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected
              </Text>
            </View>
          )}

          <ScrollView style={styles.usersList}>
            {loadingUsers ? (
              <View style={styles.emptyInviteList}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.emptyInviteText, { color: colors.textSecondary }]}>Loading contractors...</Text>
              </View>
            ) : availableUsers.length === 0 ? (
              <View style={styles.emptyInviteList}>
                <AlertCircle size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyInviteText, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? "No contractors found matching your search"
                    : "No available contractors to invite"}
                </Text>
              </View>
            ) : (
              availableUsers.map((inviteUser) => (
                <TouchableOpacity
                  key={inviteUser.id}
                  style={[
                    styles.userCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedUsers.includes(inviteUser.id) && [styles.userCardSelected, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }],
                  ]}
                  onPress={() => toggleUser(inviteUser.id)}
                >
                  <View style={styles.userCardInfo}>
                    <Text style={[styles.userCardName, { color: colors.text }]}>
                      {(inviteUser as any).fullName || (inviteUser as any).full_name || (inviteUser as any).name ||
                        ((inviteUser as any).first_name ? `${(inviteUser as any).first_name} ${(inviteUser as any).last_name || ''}`.trim() : "User")}
                    </Text>
                    <Text style={[styles.userCardCompany, { color: colors.textSecondary }]}>{(inviteUser as any).company_name || inviteUser.company}</Text>
                    <Text style={[styles.userCardRole, { color: colors.textTertiary }]}>{inviteUser.role}</Text>
                  </View>
                  {selectedUsers.includes(inviteUser.id) && (
                    <CheckCircle size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.sendInvitesButton,
              { backgroundColor: colors.primary },
              (sending || selectedUsers.length === 0) &&
              styles.sendInvitesButtonDisabled,
            ]}
            onPress={handleSendInvites}
            disabled={sending || selectedUsers.length === 0}
          >
            <Send size={20} color={colors.white} />
            <Text style={[styles.sendInvitesButtonText, { color: colors.white }]}>
              {sending
                ? "Sending..."
                : `Send ${selectedUsers.length > 0 ? selectedUsers.length : ""} Invite${selectedUsers.length !== 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginRight: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  company: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
    marginBottom: 4,
  },
  postedBy: {
    fontSize: 14,
    color: staticColors.textTertiary,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  detailCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: staticColors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
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
    marginBottom: 12,
  },
  budget: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: staticColors.textSecondary,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  requirementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: staticColors.primary,
    marginTop: 7,
    marginRight: 12,
  },
  requirementText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: staticColors.text,
  },
  applicationCard: {
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  applicantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  applicantInfo: {
    flex: 1,
    gap: 6,
  },
  applicantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  applicantDetail: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  coverLetterLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
    marginBottom: 6,
  },
  coverLetterText: {
    fontSize: 14,
    lineHeight: 20,
    color: staticColors.text,
    marginBottom: 12,
  },
  proposedRateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  proposedRateText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  applicationMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
  },
  applicationDate: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  availableFrom: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  applicationActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: staticColors.success,
  },
  rejectButton: {
    backgroundColor: staticColors.error,
  },
  messageButton: {
    backgroundColor: staticColors.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: staticColors.surface,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
    padding: 16,
  },
  applyButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  appliedSection: {
    gap: 12,
  },
  appliedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  appliedText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.success,
  },
  requestEstimateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  requestEstimateText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  messageModalContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  formGroup: {
    marginBottom: 20,
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
  messageTextArea: {
    minHeight: 200,
    paddingTop: 12,
  },
  estimateJobInfo: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  estimateJobLabel: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginBottom: 4,
  },
  estimateJobTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  submitButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  headerActions: {
    flexDirection: "row" as const,
    gap: 8,
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: "row" as const,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center" as const,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: staticColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  tabTextActive: {
    color: staticColors.primary,
    fontWeight: "700" as const,
  },
  postedDate: {
    fontSize: 13,
    color: staticColors.textTertiary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: "center" as const,
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  actionCardCount: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  applicantsContainer: {
    padding: 16,
  },
  emptyApplicants: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    gap: 16,
  },
  emptyApplicantsTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  emptyApplicantsText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
    maxWidth: 280,
  },
  inviteButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: staticColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  applicantsList: {
    gap: 12,
  },
  applicantsHeader: {
    marginBottom: 20,
  },
  applicantsTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 16,
  },
  statusCounts: {
    flexDirection: "row" as const,
    gap: 16,
    flexWrap: "wrap" as const,
  },
  statusCount: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCountText: {
    fontSize: 13,
    color: staticColors.textSecondary,
    fontWeight: "600" as const,
  },
  inviteModalContent: {
    flex: 1,
    padding: 16,
  },
  inviteJobInfo: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  inviteJobLabel: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginBottom: 4,
  },
  inviteJobTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: staticColors.text,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  selectedCount: {
    backgroundColor: staticColors.primary + "20",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: staticColors.primary,
    textAlign: "center" as const,
  },
  usersList: {
    flex: 1,
    marginBottom: 16,
  },
  emptyInviteList: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    gap: 16,
  },
  emptyInviteText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
    maxWidth: 280,
  },
  userCard: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: staticColors.border,
  },
  userCardSelected: {
    borderColor: staticColors.primary,
    backgroundColor: staticColors.primary + "10",
  },
  userCardInfo: {
    flex: 1,
    gap: 4,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  userCardCompany: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  userCardRole: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  sendInvitesButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  sendInvitesButtonDisabled: {
    opacity: 0.5,
  },
  sendInvitesButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  bookAppointmentCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: staticColors.primary + "10",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: staticColors.primary + "30",
    gap: 16,
  },
  bookAppointmentContent: {
    flex: 1,
  },
  bookAppointmentTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  bookAppointmentText: {
    fontSize: 14,
    color: staticColors.textSecondary,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  bookAppointmentButtonFooter: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: staticColors.surface,
    borderWidth: 2,
    borderColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  bookAppointmentButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: staticColors.primary,
  },
  infoCard: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
    backgroundColor: staticColors.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: staticColors.primary + "30",
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: staticColors.textSecondary,
  },
  estimateJobSubtitle: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: staticColors.textSecondary,
  },
});
