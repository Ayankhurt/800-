import { Appointment } from "@/types";
import { Stack, useRouter } from "expo-router";
import { Calendar, Clock, MapPin, Check, X, AlertCircle } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useAppointments } from "@/contexts/AppointmentsContext";

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

type AppointmentFilter = "all" | "scheduled" | "completed";

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
  onStatusUpdate: (id: string, status: "completed" | "no_show" | "cancelled") => void;
  colors: any;
}

function AppointmentCard({ appointment, onPress, onStatusUpdate, colors }: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.date);
  const isValidDate = !isNaN(appointmentDate.getTime());

  const typeColors: Record<string, string> = {
    estimate: colors.info || "#3B82F6",
    site_visit: colors.secondary,
    meeting: colors.success,
  };

  const typeLabels: Record<string, string> = {
    estimate: "Estimate",
    site_visit: "Site Visit",
    meeting: "Meeting",
  };

  const statusColors: Record<string, string> = {
    scheduled: colors.info || "#3B82F6",
    completed: colors.success,
    cancelled: colors.error,
    no_show: colors.warning,
  };

  const statusLabels: Record<string, string> = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
  };

  return (
    <TouchableOpacity
      style={[styles.appointmentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.appointmentHeader}>
        <View
          style={[
            styles.appointmentIcon,
            { backgroundColor: typeColors[appointment.type] + "15" },
          ]}
        >
          <Calendar size={24} color={typeColors[appointment.type]} />
        </View>
        <View style={styles.appointmentContent}>
          <Text style={[styles.appointmentTitle, { color: colors.text }]} numberOfLines={1}>
            {appointment.title}
          </Text>
          <Text style={[styles.appointmentContractor, { color: colors.textSecondary }]} numberOfLines={1}>
            {appointment.contractorCompany}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[appointment.status] + "15" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColors[appointment.status] },
            ]}
          />
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {isValidDate
              ? appointmentDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
              : "Invalid date"}{" "}
            at {appointment.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
            {appointment.location}
          </Text>
        </View>
      </View>

      <View style={[styles.appointmentFooter, { borderTopColor: colors.border }]}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: typeColors[appointment.type] + "15" },
          ]}
        >
          <Text
            style={[styles.typeBadgeText, { color: typeColors[appointment.type] }]}
          >
            {typeLabels[appointment.type]}
          </Text>
        </View>
        <Text style={[styles.statusLabel, { color: statusColors[appointment.status] }]}>
          {statusLabels[appointment.status]}
        </Text>
      </View>

      {appointment.status === "scheduled" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() => onStatusUpdate(appointment.id, "completed")}
          >
            <Check size={16} color={colors.white} />
            <Text style={[styles.actionBtnText, { color: colors.white }]}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.warning }]}
            onPress={() => onStatusUpdate(appointment.id, "no_show")}
          >
            <AlertCircle size={16} color={colors.white} />
            <Text style={[styles.actionBtnText, { color: colors.white }]}>No Show</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
            onPress={() => onStatusUpdate(appointment.id, "cancelled")}
          >
            <X size={16} color={colors.white} />
            <Text style={[styles.actionBtnText, { color: colors.white }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { user, colors } = useAuth();
  const { appointments, getPendingEstimateRequests, updateAppointment, refreshAppointments } = useAppointments();
  const [filter, setFilter] = useState<AppointmentFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const pendingRequests = getPendingEstimateRequests();

  const userAppointments = useMemo(() => {
    if (!user) return [];
    return appointments.filter(
      appt => appt.createdBy === user.id || appt.contractorId === user.id
    );
  }, [appointments, user]);

  const filteredAppointments = useMemo(() => {
    if (filter === "all") return userAppointments;
    return userAppointments.filter((a) => a.status === filter);
  }, [userAppointments, filter]);

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};

    filteredAppointments.forEach((appointment) => {
      const date = new Date(appointment.date);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date for appointment ${appointment.id}: ${appointment.date}`);
        return;
      }
      const key = date.toISOString().split("T")[0];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(appointment);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, appointments]) => ({
        date,
        appointments: appointments.sort((a, b) => a.time.localeCompare(b.time)),
      }));
  }, [filteredAppointments]);

  const stats = useMemo(() => {
    return {
      total: userAppointments.length,
      scheduled: userAppointments.filter((a) => a.status === "scheduled").length,
      completed: userAppointments.filter((a) => a.status === "completed").length,
    };
  }, [userAppointments]);

  const handleStatusUpdate = async (id: string, status: "completed" | "no_show" | "cancelled") => {
    await updateAppointment(id, { status });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshAppointments) {
        await refreshAppointments();
      }
    } catch (error) {
      console.error("Failed to refresh appointments:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAppointments]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Schedule",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: "700" as const,
          },
        }}
      />

      {pendingRequests.length > 0 && (
        <View style={[styles.pendingBanner, { backgroundColor: colors.warning + "20", borderBottomColor: colors.warning + "40" }]}>
          <AlertCircle size={20} color={colors.warning} />
          <Text style={[styles.pendingText, { color: colors.warning }]}>
            {pendingRequests.length} estimate request{pendingRequests.length !== 1 ? "s" : ""} pending response
          </Text>
        </View>
      )}

      <View style={[styles.statsSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.background, borderColor: colors.border }, filter === "all" && [styles.statCardActive, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }]]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.statValue,
              { color: colors.text },
              filter === "all" && [styles.statValueActive, { color: colors.primary }],
            ]}
          >
            {stats.total}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: colors.textSecondary },
              filter === "all" && [styles.statLabelActive, { color: colors.primary }],
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statCard,
            { backgroundColor: colors.background, borderColor: colors.border },
            filter === "scheduled" && [styles.statCardActive, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }],
          ]}
          onPress={() => setFilter("scheduled")}
        >
          <Text
            style={[
              styles.statValue,
              { color: colors.text },
              filter === "scheduled" && [styles.statValueActive, { color: colors.primary }],
            ]}
          >
            {stats.scheduled}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: colors.textSecondary },
              filter === "scheduled" && [styles.statLabelActive, { color: colors.primary }],
            ]}
          >
            Scheduled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statCard,
            { backgroundColor: colors.background, borderColor: colors.border },
            filter === "completed" && [styles.statCardActive, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }],
          ]}
          onPress={() => setFilter("completed")}
        >
          <Text
            style={[
              styles.statValue,
              { color: colors.text },
              filter === "completed" && [styles.statValueActive, { color: colors.primary }],
            ]}
          >
            {stats.completed}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: colors.textSecondary },
              filter === "completed" && [styles.statLabelActive, { color: colors.primary }],
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groupedAppointments}
        renderItem={({ item }) => (
          <View style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { color: colors.text }]}>
              {(() => {
                const date = new Date(item.date);
                return isNaN(date.getTime())
                  ? "Invalid date"
                  : date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
              })()}
            </Text>
            {item.appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onPress={() => {
                  router.push(`/appointment-details?id=${appointment.id}`);
                }}
                onStatusUpdate={handleStatusUpdate}
                colors={colors}
              />
            ))}
          </View>
        )}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No appointments</Text>
            <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
              Appointments will appear here once scheduled
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: staticColors.warning + "20",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.warning + "40",
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.warning,
  },
  statsSection: {
    flexDirection: "row" as const,
    padding: 16,
    gap: 12,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center" as const,
    borderWidth: 2,
    borderColor: staticColors.border,
  },
  statCardActive: {
    borderColor: staticColors.primary,
    backgroundColor: staticColors.primary + "10",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  statValueActive: {
    color: staticColors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: staticColors.textSecondary,
    fontWeight: "600" as const,
  },
  statLabelActive: {
    color: staticColors.primary,
  },
  listContent: {
    padding: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  appointmentHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  appointmentContractor: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  appointmentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: staticColors.textSecondary,
    flex: 1,
  },
  appointmentFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: staticColors.white,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
  },
});
