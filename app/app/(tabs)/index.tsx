import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/contexts/JobsContext";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { Job } from "@/types";
import { Stack, useRouter } from "expo-router";
import { Calendar, FileText, TrendingUp, Users, Briefcase, Shield, Flag, CheckCircle } from "lucide-react-native";
import React, { useMemo, useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { statsAPI, jobsAPI, projectsAPI } from "@/services/api";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

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


interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon, label, value, color, colors }: StatCardProps & { colors: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + "15" }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

function JobCard({ job, onPress, colors }: JobCardProps & { colors: any }) {
  const urgencyColors: Record<string, string> = {
    low: colors.success,
    medium: colors.warning,
    high: colors.secondary,
    urgent: colors.error,
  };

  return (
    <TouchableOpacity style={[styles.jobCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.jobHeader}>
        <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
          {job.title}
        </Text>
        <View
          style={[
            styles.urgencyBadge,
            { backgroundColor: urgencyColors[job.urgency] },
          ]}
        >
          <Text style={[styles.urgencyText, { color: colors.white }]}>
            {job.urgency.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.jobDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {job.description}
      </Text>
      <View style={styles.jobFooter}>
        <View style={styles.jobMeta}>
          <Users size={14} color={colors.textSecondary} />
          <Text style={[styles.jobMetaText, { color: colors.textSecondary }]}>
            {job.applicationsCount} Application{job.applicationsCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={[styles.jobLocation, { color: colors.textSecondary }]}>{job.location}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, colors } = useAuth();
  const { jobs } = useJobs();
  const { appointments, getUpcomingAppointments } = useAppointments();

  const [stats, setStats] = useState({
    activeJobsCount: 0,
    totalJobs: 0,
    totalApplications: 0,
    upcomingCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [apiJobs, setApiJobs] = useState<Job[]>([]);
  const [apiProjects, setApiProjects] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch stats from API
  const fetchStats = async (isRefresh = false) => {
    if (!user) return;

    if (!isRefresh) setIsLoadingStats(true);
    try {
      console.log(`[API] GET /stats/${user.role === "ADMIN" ? "admin-dashboard" : "user-dashboard"}`);
      const response =
        user.role === "ADMIN"
          ? await statsAPI.getAdminDashboardStats()
          : await statsAPI.getUserDashboardStats();

      if (response.success && response.data) {
        const data = response.data;
        if (user.role === "ADMIN") {
          setStats({
            activeJobsCount: data.totalProjects || 0,
            totalJobs: data.totalUsers || 0,
            totalApplications: data.pendingApprovals || 0,
            upcomingCount: data.openDisputes || 0,
          });
        } else if (user.role === "PM" || user.role === "GC") {
          setStats({
            activeJobsCount: data.activeProjects || 0,
            totalJobs: data.totalJobs || 0,
            totalApplications: data.bidsReceived || data.bidsSubmitted || 0,
            upcomingCount: data.milestonesCompleted || 0,
          });
        } else {
          // Contractors/Technicians
          setStats({
            activeJobsCount: data.activeProjects || 0,
            totalJobs: data.totalJobs || 0,
            totalApplications: data.bidsSubmitted || 0,
            upcomingCount: data.milestonesCompleted || 0,
          });
        }
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch stats:", error);
      // Fallback to local calculations if API fails
      setStats({
        activeJobsCount: jobs.filter((j) => j.status === "open").length,
        totalJobs: jobs.length,
        totalApplications: jobs.reduce((acc, j) => acc + j.applicationsCount, 0),
        upcomingCount: appointments.filter((a) => a.status === "scheduled").length,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch jobs data separately
  const fetchJobsData = async (isRefresh = false) => {
    if (!user) return;

    if (!isRefresh) setIsLoadingJobs(true);
    try {
      console.log("[API] Fetching jobs");
      const jobsResponse = await jobsAPI.getAll();
      if (jobsResponse.success && jobsResponse.data) {
        const jobsData = jobsResponse.data.jobs || (Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
        const mappedJobs = jobsData.map((job: any) => ({
          id: job.id || job.job_id,
          title: job.title || job.job_title,
          description: job.description,
          trade: job.trade_type || job.trade || job.category || "All",
          location: job.location,
          status: job.status || "open",
          urgency: job.urgency || "medium",
          startDate: job.start_date || job.startDate,
          endDate: job.end_date || job.endDate,
          budget: job.budget_min ? `$${job.budget_min}` : (job.budget || null),
          payRate: job.pay_rate || job.payRate,
          postedBy: job.posted_by || job.postedBy || job.project_manager_id,
          postedByName: job.project_manager?.first_name ? `${job.project_manager.first_name} ${job.project_manager.last_name || ''}` : (job.posted_by_name || job.postedByName || "Unknown"),
          postedByCompany: job.posted_by_company || job.postedByCompany || "",
          applicationsCount: job.application_count || job.applications_count || job.applicationsCount || 0,
          createdAt: job.created_at || job.createdAt,
          updatedAt: job.updated_at || job.updatedAt,
        }));
        setApiJobs(mappedJobs);
      }

      // Fetch Projects (mainly for PM/GC/Admin)
      if (user.role !== "SUB" && user.role !== "TS") {
        console.log("[API] Fetching projects");
        const projectsResponse = await projectsAPI.getAll();
        if (projectsResponse.success && projectsResponse.data) {
          const projectsData = Array.isArray(projectsResponse.data) ? projectsResponse.data : (projectsResponse.data.projects || []);
          setApiProjects(projectsData);
        }
      }
    } catch (error: any) {
      console.error("[API] Failed to fetch home data:", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadAllData = async (isRefresh = false) => {
    await Promise.all([fetchStats(isRefresh), fetchJobsData(isRefresh)]);
  };

  // Initial Fetch
  useEffect(() => {
    loadAllData();
  }, [user]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadAllData(true);
    setRefreshing(false);
  }, [user]);

  const mainContentItems = useMemo(
    () => {
      if (user?.role === "PM" || user?.role === "GC") {
        return apiProjects.slice(0, 5).map(p => ({
          ...p,
          id: p.id,
          title: p.title,
          description: p.description || "Project in progress.",
          status: p.status || "active",
          location: p.location || "On-site",
          trade: p.category || "Project",
          applicationsCount: p.bids_count || 0,
          urgency: "medium",
          isProject: true
        }));
      }
      return apiJobs.filter((j) => j.status === "open").slice(0, 5);
    },
    [apiJobs, apiProjects, user?.role]
  );

  const upcomingAppointmentsList = useMemo(
    () => getUpcomingAppointments().slice(0, 2),
    [getUpcomingAppointments, appointments]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Bidroom",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
          headerRight: () => <NotificationBell />,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome back,</Text>
            <View style={styles.userNameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName}</Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{user?.role}</Text>
              </View>
              {user?.role === "ADMIN" && (
                <View style={[styles.adminModeBadge, { backgroundColor: colors.error + "15", borderColor: colors.error }]}>
                  <Text style={[styles.adminModeText, { color: colors.error }]}>PANEL</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsGrid}>
            {isLoadingStats && !refreshing ? (
              <View style={styles.loadingStats}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading stats...</Text>
              </View>
            ) : (
              <View style={styles.statsGridContent}>
                {user?.role === "ADMIN" ? (
                  <>
                    <StatCard
                      icon={<Users size={20} color={colors.primary} />}
                      label="Total Users"
                      value={stats.totalJobs}
                      color={colors.primary}
                      colors={colors}
                    />
                    <StatCard
                      icon={<Briefcase size={20} color={colors.success} />}
                      label="All Projects"
                      value={stats.activeJobsCount}
                      color={colors.success}
                      colors={colors}
                    />
                    <StatCard
                      icon={<Shield size={20} color={colors.secondary} />}
                      label="Pending"
                      value={stats.totalApplications}
                      color={colors.secondary}
                      colors={colors}
                    />
                    <StatCard
                      icon={<Flag size={20} color={colors.error} />}
                      label="Disputes"
                      value={stats.upcomingCount}
                      color={colors.error}
                      colors={colors}
                    />
                  </>
                ) : user?.role === "PM" || user?.role === "GC" ? (
                  <>
                    <StatCard
                      icon={<Briefcase size={20} color={colors.primary} />}
                      label="My Projects"
                      value={stats.activeJobsCount}
                      color={colors.primary}
                      colors={colors}
                    />
                    <StatCard
                      icon={<TrendingUp size={20} color={colors.success} />}
                      label="Bids Recv"
                      value={stats.totalApplications}
                      color={colors.success}
                      colors={colors}
                    />
                    <StatCard
                      icon={<FileText size={20} color={colors.secondary} />}
                      label="Total Jobs"
                      value={stats.totalJobs}
                      color={colors.secondary}
                      colors={colors}
                    />
                    <StatCard
                      icon={<CheckCircle size={20} color={colors.info} />}
                      label="Done"
                      value={stats.upcomingCount}
                      color={colors.info}
                      colors={colors}
                    />
                  </>
                ) : (
                  <>
                    <StatCard
                      icon={<Briefcase size={20} color={colors.primary} />}
                      label="Active Projects"
                      value={stats.activeJobsCount}
                      color={colors.primary}
                      colors={colors}
                    />
                    <StatCard
                      icon={<TrendingUp size={20} color={colors.success} />}
                      label="My Bids"
                      value={stats.totalApplications}
                      color={colors.success}
                      colors={colors}
                    />
                    <StatCard
                      icon={<FileText size={20} color={colors.secondary} />}
                      label="Jobs Found"
                      value={stats.totalJobs}
                      color={colors.secondary}
                      colors={colors}
                    />
                    <StatCard
                      icon={<CheckCircle size={20} color={colors.info} />}
                      label="Completed"
                      value={stats.upcomingCount}
                      color={colors.info}
                      colors={colors}
                    />
                  </>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {user?.role === "PM" || user?.role === "GC" ? "My Recent Projects" : "Recommended Jobs"}
              </Text>
              <TouchableOpacity onPress={() => router.push('/jobs')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {mainContentItems.length > 0 ? (
              mainContentItems.map((item) => (
                <JobCard
                  key={item.id}
                  job={item}
                  colors={colors}
                  onPress={() => {
                    if (item.isProject) {
                      router.push(`/project-details?id=${item.id}`);
                    } else {
                      router.push(`/job-details?id=${item.id}`);
                    }
                  }}
                />
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12 }]}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No items found</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => router.push('/schedule')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingAppointmentsList.length > 0 ? (
              upcomingAppointmentsList.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.appointmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    router.push(`/appointment-details?id=${appointment.id}`);
                  }}
                >
                  <View style={styles.appointmentHeader}>
                    <View
                      style={[
                        styles.appointmentIcon,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <Calendar size={20} color={colors.primary} />
                    </View>
                    <View style={styles.appointmentContent}>
                      <Text style={[styles.appointmentTitle, { color: colors.text }]} numberOfLines={1}>
                        {appointment.title}
                      </Text>
                      <Text style={[styles.appointmentContractor, { color: colors.textSecondary }]}>
                        {appointment.contractorCompany}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.appointmentMeta}>
                    <Text style={[styles.appointmentTime, { color: colors.textSecondary }]}>
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12 }]}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No upcoming appointments</Text>
              </View>
            )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: staticColors.textSecondary,
    marginBottom: 4,
  },
  userNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flexWrap: "wrap" as const,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  adminModeBadge: {
    backgroundColor: staticColors.error + "15",
    borderWidth: 1,
    borderColor: staticColors.error,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adminModeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: staticColors.error,
    letterSpacing: 0.5,
  },
  roleBadge: {
    backgroundColor: staticColors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: staticColors.primary + "30",
    height: 20,
    justifyContent: 'center',
  },
  roleBadgeText: {
    color: staticColors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  statsGrid: {
    marginBottom: 24,
  },
  statsGridContent: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: staticColors.textSecondary,
    fontWeight: "500" as const,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  jobCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  jobHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 8,
  },
  jobTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginRight: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  jobDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  jobFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  jobMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  jobMetaText: {
    fontSize: 13,
    color: staticColors.textSecondary,
    fontWeight: "500" as const,
  },
  jobLocation: {
    fontSize: 13,
    color: staticColors.textSecondary,
    fontWeight: "500" as const,
  },
  appointmentCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  appointmentHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 8,
  },
  appointmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  appointmentContractor: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  appointmentMeta: {
    paddingLeft: 56,
  },
  appointmentTime: {
    fontSize: 13,
    color: staticColors.textSecondary,
    fontWeight: "500" as const,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  loadingStats: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginTop: 8,
  },
});
