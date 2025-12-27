import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Building,
  FileText,
  X,
  Check,
  XCircle,
  AlertCircle,
  Edit3,
} from "lucide-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAppointments } from "@/contexts/AppointmentsContext";
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

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, colors } = useAuth();
  const { appointments, updateAppointment } = useAppointments();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const appointment = appointments.find((a) => a.id === id);

  if (!appointment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Appointment Details",
            headerShown: true,
          }}
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Appointment not found</Text>
        </View>
      </View>
    );
  }

  const typeColors = {
    estimate: colors.info || "#3B82F6",
    site_visit: colors.secondary,
    meeting: colors.success,
  };

  const typeLabels = {
    estimate: "Estimate",
    site_visit: "Site Visit",
    meeting: "Meeting",
  };

  const statusColors = {
    scheduled: colors.info || "#3B82F6",
    completed: colors.success,
    cancelled: colors.error,
    no_show: colors.warning,
  };

  const statusLabels = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
  };

  const handleStatusUpdate = async (
    status: "completed" | "no_show" | "cancelled"
  ) => {
    Alert.alert(
      "Update Status",
      `Mark this appointment as ${statusLabels[status]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await updateAppointment(appointment.id, { status });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Appointment Details",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: typeColors[appointment.type] + "20" },
            ]}
          >
            <Calendar size={32} color={typeColors[appointment.type]} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>{appointment.title}</Text>
            <View style={styles.headerBadges}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeColors[appointment.type] },
                ]}
              >
                <Text style={[styles.typeBadgeText, { color: colors.white }]}>
                  {typeLabels[appointment.type]}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[appointment.status] },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: colors.white }]}>
                  {statusLabels[appointment.status]}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Date & Time</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.infoRow}>
              <Calendar size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Date</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {appointment.date ? new Date(appointment.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }) : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Clock size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Time</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{appointment.time}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
          <View style={styles.locationContainer}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.text }]}>{appointment.location}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contractor</Text>
          <View style={[styles.contractorCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.contractorRow}>
              <User size={18} color={colors.textSecondary} />
              <Text style={[styles.contractorName, { color: colors.text }]}>
                {appointment.contractorName}
              </Text>
            </View>
            <View style={styles.contractorRow}>
              <Building size={18} color={colors.textSecondary} />
              <Text style={[styles.contractorCompany, { color: colors.textSecondary }]}>
                {appointment.contractorCompany}
              </Text>
            </View>
          </View>
        </View>

        {!!appointment.notes && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              {appointment.status === "scheduled" && (
                <TouchableOpacity
                  onPress={() => setShowNotesModal(true)}
                  style={styles.editButton}
                >
                  <Edit3 size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{appointment.notes}</Text>
          </View>
        )}

        {!appointment.notes && appointment.status === "scheduled" && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.addNotesButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowNotesModal(true)}
            >
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.addNotesText, { color: colors.primary }]}>Add Notes</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>
          <View style={styles.metadataContainer}>
            {!!appointment.createdByName && (
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Created By:</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {appointment.createdByName}
                </Text>
              </View>
            )}
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Created:</Text>
              <Text style={[styles.metadataValue, { color: colors.text }]}>
                {appointment.createdAt ? new Date(appointment.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            {appointment.updatedAt && (
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Last Updated:</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {appointment.updatedAt ? new Date(appointment.updatedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            )}
            {appointment.completedAt && (
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>Completed:</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {appointment.completedAt ? new Date(appointment.completedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!!appointment.jobId && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.viewJobButton, { backgroundColor: colors.primary }]}
              onPress={() =>
                router.push(`/job-details?id=${appointment.jobId}`)
              }
            >
              <Text style={[styles.viewJobButtonText, { color: colors.white }]}>View Related Job</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {appointment.status === "scheduled" && (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => handleStatusUpdate("completed")}
          >
            <Check size={20} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning }]}
            onPress={() => handleStatusUpdate("no_show")}
          >
            <AlertCircle size={20} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>No Show</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleStatusUpdate("cancelled")}
          >
            <XCircle size={20} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <NotesModal
        visible={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        currentNotes={appointment.notes || ""}
        colors={colors}
        onSave={async (notes) => {
          await updateAppointment(appointment.id, { notes });
          setShowNotesModal(false);
        }}
      />
    </View>
  );
}

function NotesModal({
  visible,
  onClose,
  currentNotes,
  onSave,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  currentNotes: string;
  onSave: (notes: string) => Promise<void>;
  colors: any;
}) {
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(notes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Notes</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Add notes about this appointment..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            placeholderTextColor={colors.textTertiary}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={[styles.saveButtonText, { color: colors.white }]}>
              {saving ? "Saving..." : "Save Notes"}
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 12,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  section: {
    backgroundColor: staticColors.surface,
    padding: 20,
    marginBottom: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
    marginBottom: 12,
  },
  editButton: {
    padding: 4,
  },
  dateTimeContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: staticColors.textTertiary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: staticColors.text,
  },
  contractorCard: {
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  contractorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  contractorCompany: {
    fontSize: 15,
    color: staticColors.textSecondary,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 24,
    color: staticColors.textSecondary,
  },
  addNotesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: staticColors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    borderStyle: "dashed",
  },
  addNotesText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.primary,
  },
  metadataContainer: {
    gap: 12,
  },
  metadataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metadataLabel: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  viewJobButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  viewJobButtonText: {
    fontSize: 15,
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
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
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
    padding: 16,
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
    minHeight: 200,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
});
