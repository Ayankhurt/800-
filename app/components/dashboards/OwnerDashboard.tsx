import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Briefcase,
  CheckCircle2,
  DollarSign,
  FileText,
  Calendar,
  ArrowRight,
  Users,
  Hammer,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useJobs } from "@/contexts/JobsContext";
import { useBids } from "@/contexts/BidsContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  calculateProjectStats,
  calculateWorkflowMetrics,
  generateAlerts,
  getNextActions,
  getProjectPhase,
  getProjectHealthStatus,
} from "@/utils/dashboard";
import { UserRole } from "@/types";

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

interface StatCardProps {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  onPress?: () => void;
  colors: any;
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
  onPress,
  colors,
}: StatCardProps) {
  const iconEl = React.cloneElement(icon, { size: 20, color } as any);

  if (onPress) {
    return (
      <TouchableOpacity
        style={[
          styles.statCard,
          { borderLeftColor: color, backgroundColor: colors.surface },
        ]}
        onPress={onPress}
      >
        <View
          style={[styles.statIconContainer, { backgroundColor: color + "15" }]}
        >
          {iconEl}
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
          {subtext && (
            <Text style={[styles.statSubtext, { color: colors.textTertiary }]}>
              {subtext}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.statCard,
        { borderLeftColor: color, backgroundColor: colors.surface },
      ]}
    >
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "15" }]}
      >
        {iconEl}
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {subtext && (
          <Text style={[styles.statSubtext, { color: colors.textTertiary }]}>
            {subtext}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { user, colors } = useAuth();
  const { jobs, applications } = useJobs();
  const { bids } = useBids();
  const { milestones, getUserProjects } = useProjects();
  const { appointments } = useAppointments();

  const [activeTab, setActiveTab] = useState<"overview" | "active" | "pipeline">(
    "overview"
  );

  const userProjects = useMemo(() => getUserProjects(), [getUserProjects]);
  const activeProjects = useMemo(
    () => userProjects.filter((p) => p.status === "active"),
    [userProjects]
  );

  const projectStats = useMemo(
    () => calculateProjectStats(userProjects),
    [userProjects]
  );

  const workflowMetrics = useMemo(
    () =>
      calculateWorkflowMetrics(
        jobs,
        applications,
        bids,
        appointments,
        milestones
      ),
    [jobs, applications, bids, appointments, milestones]
  );

  const alerts = useMemo(
    () => generateAlerts(userProjects, milestones, applications, appointments),
    [userProjects, milestones, applications, appointments]
  );

  const nextActions = useMemo(() => {
    const roleMap: Record<string, UserRole> = {
      ADMIN: "Admin",
      GC: "GC",
      PM: "Project Manager",
      SUB: "Subcontractor",
      TS: "Trade Specialist",
      VIEWER: "Viewer",
    };
    const role = roleMap[user?.role || ""] || "Project Manager";
    return getNextActions(
      role,
      userProjects,
      milestones,
      applications,
      bids
    );
  }, [user?.role, userProjects, milestones, applications, bids]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "scheduled").slice(0, 3),
    [appointments]
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
          Welcome back,
        </Text>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.fullName || user?.name}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your construction projects from start to finish
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon={<Hammer />}
          label="Active Projects"
          value={projectStats.activeProjects}
          subtext={`${projectStats.totalProjects} total`}
          color={colors.primary}
          colors={colors}
        />
        <StatCard
          icon={<FileText />}
          label="Open Jobs"
          value={workflowMetrics.jobsPosted}
          subtext={`${workflowMetrics.applicationsPending} pending`}
          color={colors.secondary}
          onPress={() => router.push("/jobs")}
          colors={colors}
        />
        <StatCard
          icon={<DollarSign />}
          label="Total Value"
          value={`$${(projectStats.totalRevenue / 1000).toFixed(0)}k`}
          subtext={`${projectStats.completionRate}% complete`}
          color={colors.success}
          colors={colors}
        />
        <StatCard
          icon={<CheckCircle2 />}
          label="Milestones"
          value={`${workflowMetrics.milestonesCompleted}/${workflowMetrics.milestonesTotal}`}
          subtext="completed"
          color={colors.info}
          colors={colors}
        />
      </View>

      {alerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Alerts & Notifications
            </Text>
            <Text
              style={[
                styles.badge,
                { backgroundColor: colors.error, color: colors.white },
              ]}
            >
              {alerts.length}
            </Text>
          </View>
          {alerts.slice(0, 3).map((alert) => {
            const alertColors = {
              error: colors.error,
              warning: colors.warning,
              info: colors.info,
              success: colors.success,
            };
            return (
              <TouchableOpacity
                key={alert.id}
                style={[styles.alertCard, { backgroundColor: colors.surface }]}
                onPress={() =>
                  alert.actionUrl && router.push(alert.actionUrl as any)
                }
              >
                <View
                  style={[
                    styles.alertIndicator,
                    { backgroundColor: alertColors[alert.type] },
                  ]}
                />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    {alert.title}
                  </Text>
                  <Text
                    style={[
                      styles.alertMessage,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {alert.message}
                  </Text>
                </View>
                <ArrowRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Next Actions
          </Text>
        </View>
        {nextActions.length > 0 ? (
          nextActions.slice(0, 4).map((action) => {
            const priorityColors = {
              high: colors.error,
              medium: colors.warning,
              low: colors.textSecondary,
            };
            return (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: colors.surface }]}
                onPress={() => router.push(action.actionUrl as any)}
              >
                <View style={styles.actionLeft}>
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priorityColors[action.priority] },
                    ]}
                  />
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>
                      {action.title}
                    </Text>
                    <Text
                      style={[
                        styles.actionDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {action.description}
                    </Text>
                  </View>
                </View>
                <ArrowRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <CheckCircle2 size={48} color={colors.success} />
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              All caught up!
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "overview" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab("overview")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "overview"
                    ? colors.white
                    : colors.textSecondary,
              },
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "active" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab("active")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "active" ? colors.white : colors.textSecondary,
              },
            ]}
          >
            Active Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "pipeline" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab("pipeline")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "pipeline"
                    ? colors.white
                    : colors.textSecondary,
              },
            ]}
          >
            Pipeline
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "overview" && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Workflow Summary
              </Text>
            </View>
            <View
              style={[
                styles.workflowGrid,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.workflowItem}>
                <Text
                  style={[styles.workflowLabel, { color: colors.textSecondary }]}
                >
                  Jobs Posted
                </Text>
                <Text style={[styles.workflowValue, { color: colors.text }]}>
                  {workflowMetrics.jobsPosted}
                </Text>
              </View>
              <View
                style={[styles.workflowDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.workflowItem}>
                <Text
                  style={[styles.workflowLabel, { color: colors.textSecondary }]}
                >
                  Jobs Filled
                </Text>
                <Text style={[styles.workflowValue, { color: colors.text }]}>
                  {workflowMetrics.jobsFilled}
                </Text>
              </View>
              <View
                style={[styles.workflowDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.workflowItem}>
                <Text
                  style={[styles.workflowLabel, { color: colors.textSecondary }]}
                >
                  Pending Apps
                </Text>
                <Text style={[styles.workflowValue, { color: colors.text }]}>
                  {workflowMetrics.applicationsPending}
                </Text>
              </View>
              <View
                style={[styles.workflowDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.workflowItem}>
                <Text
                  style={[styles.workflowLabel, { color: colors.textSecondary }]}
                >
                  Bids Awarded
                </Text>
                <Text style={[styles.workflowValue, { color: colors.text }]}>
                  {workflowMetrics.bidsAwarded}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Upcoming Appointments
              </Text>
              <TouchableOpacity onPress={() => router.push("/schedule")}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() =>
                    router.push(`/appointment-details?id=${appointment.id}` as any)
                  }
                >
                  <View
                    style={[
                      styles.appointmentIconContainer,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Calendar size={20} color={colors.primary} />
                  </View>
                  <View style={styles.appointmentContent}>
                    <Text style={[styles.appointmentTitle, { color: colors.text }]}>
                      {appointment.title}
                    </Text>
                    <Text
                      style={[
                        styles.appointmentMeta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {new Date(appointment.date).toLocaleDateString()} at{" "}
                      {appointment.time}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateSmall}>
                <Calendar size={32} color={colors.textTertiary} />
                <Text
                  style={[
                    styles.emptyStateTextSmall,
                    { color: colors.textSecondary },
                  ]}
                >
                  No upcoming appointments
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {activeTab === "active" && (
        <View style={styles.section}>
          {activeProjects.length > 0 ? (
            activeProjects.map((project) => {
              const projectMilestones = milestones.filter(
                (m) => m.projectId === project.id
              );
              const phase = getProjectPhase(project, projectMilestones);
              const health = getProjectHealthStatus(project, projectMilestones);

              const healthColors = {
                on_track: colors.success,
                ahead: colors.info,
                at_risk: colors.warning,
                behind: colors.error,
              };

              return (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() =>
                    router.push(`/project-dashboard?id=${project.id}` as any)
                  }
                >
                  <View style={styles.projectHeader}>
                    <View style={styles.projectTitleContainer}>
                      <Text style={[styles.projectTitle, { color: colors.text }]}>
                        {project.title}
                      </Text>
                      <Text
                        style={[
                          styles.projectPhase,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {phase}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.healthBadge,
                        { backgroundColor: healthColors[health.status] },
                      ]}
                    >
                      <Text style={[styles.healthBadgeText, { color: colors.white }]}>
                        {health.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${project.completionPercentage}%`,
                            backgroundColor: healthColors[health.status],
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.text }]}>
                      {project.completionPercentage}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.projectFooter,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <View style={styles.projectMeta}>
                      <DollarSign size={14} color={colors.textSecondary} />
                      <Text
                        style={[
                          styles.projectMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        ${project.paidAmount.toLocaleString()} / $
                        {project.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.projectMeta}>
                      <Users size={14} color={colors.textSecondary} />
                      <Text
                        style={[
                          styles.projectMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {project.contractorName}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Briefcase size={48} color={colors.textTertiary} />
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                No active projects
              </Text>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => router.push("/jobs")}
              >
                <Text
                  style={[styles.primaryButtonText, { color: colors.white }]}
                >
                  Post a Job
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {activeTab === "pipeline" && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Open Jobs
              </Text>
              <TouchableOpacity onPress={() => router.push("/jobs")}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            {jobs
              .filter((j) => j.status === "open")
              .slice(0, 3)
              .map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={[
                    styles.pipelineCard,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => router.push(`/job-details?id=${job.id}` as any)}
                >
                  <Text style={[styles.pipelineTitle, { color: colors.text }]}>
                    {job.title}
                  </Text>
                  <View style={styles.pipelineMeta}>
                    <View style={styles.pipelineMetaItem}>
                      <Users size={14} color={colors.textSecondary} />
                      <Text
                        style={[
                          styles.pipelineMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {job.applicationsCount} applications
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.pipelineMetaText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {job.location}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Pending Bids
              </Text>
              <TouchableOpacity onPress={() => router.push("/bids")}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            {bids
              .filter((b) => b.status === "pending" || b.status === "submitted")
              .slice(0, 3)
              .map((bid) => (
                <TouchableOpacity
                  key={bid.id}
                  style={[
                    styles.pipelineCard,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => router.push(`/bid-details?id=${bid.id}` as any)}
                >
                  <Text style={[styles.pipelineTitle, { color: colors.text }]}>
                    {bid.projectName}
                  </Text>
                  <View style={styles.pipelineMeta}>
                    <View style={styles.pipelineMetaItem}>
                      <FileText size={14} color={colors.textSecondary} />
                      <Text
                        style={[
                          styles.pipelineMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {bid.submittedCount} of {bid.contractorCount} submitted
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.pipelineMetaText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Due {new Date(bid.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        </>
      )}

      <View style={styles.quickActions}>
        <Text style={[styles.quickActionsTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push("/jobs")}
          >
            <Briefcase size={24} color={colors.white} />
            <Text style={[styles.quickActionText, { color: colors.white }]}>
              Post Job
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push("/bids")}
          >
            <FileText size={24} color={colors.white} />
            <Text style={[styles.quickActionText, { color: colors.white }]}>
              Create Bid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push("/contractors")}
          >
            <Users size={24} color={colors.white} />
            <Text style={[styles.quickActionText, { color: colors.white }]}>
              Find Contractors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => router.push("/schedule")}
          >
            <Calendar size={24} color={colors.white} />
            <Text style={[styles.quickActionText, { color: colors.white }]}>
              Schedule
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
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
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  statSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  badge: {
    fontSize: 11,
    fontWeight: "700" as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden" as const,
  },
  alertCard: {
    flexDirection: "row" as const,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
  },
  actionCard: {
    flexDirection: "row" as const,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  actionDescription: {
    fontSize: 12,
  },
  tabBar: {
    flexDirection: "row" as const,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center" as const,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  workflowGrid: {
    flexDirection: "row" as const,
    borderRadius: 12,
    padding: 16,
  },
  workflowItem: {
    flex: 1,
    alignItems: "center" as const,
  },
  workflowLabel: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: "center" as const,
  },
  workflowValue: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  workflowDivider: {
    width: 1,
    height: 40,
  },
  appointmentCard: {
    flexDirection: "row" as const,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: "center" as const,
    gap: 12,
  },
  appointmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  appointmentMeta: {
    fontSize: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  projectCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  projectHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 12,
  },
  projectTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  projectPhase: {
    fontSize: 12,
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  progressContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600" as const,
    minWidth: 36,
    textAlign: "right" as const,
  },
  projectFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  projectMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  projectMetaText: {
    fontSize: 12,
  },
  pipelineCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  pipelineTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  pipelineMeta: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  pipelineMetaItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  pipelineMetaText: {
    fontSize: 12,
  },
  quickActions: {
    padding: 16,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
    gap: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
  },
  emptyStateSmall: {
    alignItems: "center" as const,
    paddingVertical: 32,
    gap: 8,
  },
  emptyStateTextSmall: {
    fontSize: 14,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
