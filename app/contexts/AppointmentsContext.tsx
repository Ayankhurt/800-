import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { Appointment, EstimateRequest, JobNotification } from "@/types";
import { useAuth } from "./AuthContext";
import { useJobs } from "./JobsContext";
import { appointmentsAPI } from "@/services/api";

const STORAGE_KEYS = {
  APPOINTMENTS: "appointments",
  ESTIMATE_REQUESTS: "estimate_requests",
};

export const [AppointmentsProvider, useAppointments] = createContextHook(() => {
  const { user } = useAuth();
  const { getJobById, addNotification } = useJobs();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [estimateRequests, setEstimateRequests] = useState<EstimateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [storedRequests, apiResponse] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ESTIMATE_REQUESTS),
        appointmentsAPI.getAll(),
      ]);

      setEstimateRequests(storedRequests ? JSON.parse(storedRequests) : []);

      if (apiResponse.success && apiResponse.data) {
        const mappedAppointments = apiResponse.data.map((appt: any) => {
          const isAttendee = appt.attendee_id === user.id;
          const otherUser = isAttendee ? appt.creator : appt.attendee;
          const otherFirstName = otherUser?.first_name || "";
          const otherLastName = otherUser?.last_name || "";
          const otherFullName = (otherFirstName + " " + otherLastName).trim() || "Unknown";

          return {
            id: appt.id,
            title: appt.title,
            contractorId: appt.attendee_id,
            contractorName: otherFullName,
            contractorCompany: otherUser?.company_name || "",
            date: appt.start_time.split("T")[0],
            time:
              appt.start_time.split("T")[1]?.substring(0, 5) || "00:00",
            type: "meeting", // Generic type if not specified
            location: "Online", // Default
            status: appt.status,
            notes: appt.description,
            jobId: appt.project_id,
            createdBy: appt.created_by,
            createdAt: appt.created_at,
            updatedAt: appt.updated_at,
          };
        });
        setAppointments(mappedAppointments);
      } else {
        // Fallback to local storage if API fails
        const storedAppointments = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        setAppointments(storedAppointments ? JSON.parse(storedAppointments) : []);
      }
    } catch (error) {
      console.warn("Appointments API unavailable, using local storage:", error);
      const storedAppointments = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      setAppointments(storedAppointments ? JSON.parse(storedAppointments) : []);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAppointments = useCallback(async (updatedAppointments: Appointment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updatedAppointments));
      setAppointments(updatedAppointments);
    } catch (error) {
      console.error("Failed to save appointments:", error);
    }
  }, []);

  const saveEstimateRequests = useCallback(async (updatedRequests: EstimateRequest[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ESTIMATE_REQUESTS, JSON.stringify(updatedRequests));
      setEstimateRequests(updatedRequests);
    } catch (error) {
      console.error("Failed to save estimate requests:", error);
    }
  }, []);

  const requestEstimate = useCallback(async (data: {
    jobId: string;
    applicationId: string;
    requestedFrom: string;
    requestedFromName: string;
    location: string;
    description: string;
    preferredDate?: string;
    preferredTime?: string;
  }) => {
    if (!user) return null;

    const job = getJobById(data.jobId);
    if (!job) return null;

    const newRequest: EstimateRequest = {
      id: `est-req-${Date.now()}`,
      jobId: data.jobId,
      applicationId: data.applicationId,
      requestedBy: user.id,
      requestedByName: user.fullName || "Me",
      requestedFrom: data.requestedFrom,
      requestedFromName: data.requestedFromName,
      location: data.location,
      description: data.description,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRequests = [...estimateRequests, newRequest];
    await saveEstimateRequests(updatedRequests);

    const notification: JobNotification = {
      id: `notif-${Date.now()}`,
      userId: data.requestedFrom,
      jobId: data.jobId,
      applicationId: data.applicationId,
      type: "estimate_requested",
      title: "Estimate Request",
      message: `${user.fullName || "User"} requested an estimate for ${job.title}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await addNotification(notification);

    return newRequest;
  }, [estimateRequests, getJobById, saveEstimateRequests, user, addNotification]);

  const confirmEstimate = useCallback(async (
    requestId: string,
    appointmentData: {
      date: string;
      time: string;
      notes?: string;
    }
  ) => {
    if (!user) return null;

    const request = estimateRequests.find(r => r.id === requestId);
    if (!request) return null;

    const job = getJobById(request.jobId);
    if (!job) return null;

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      title: `Estimate: ${job.title}`,
      contractorId: request.requestedFrom,
      contractorName: request.requestedFromName,
      contractorCompany: request.requestedFromName,
      date: appointmentData.date,
      time: appointmentData.time,
      type: "estimate",
      location: request.location,
      status: "scheduled",
      notes: appointmentData.notes || request.description,
      jobId: request.jobId,
      applicationId: request.applicationId,
      createdBy: user.id,
      createdByName: user.fullName || "Me",
      requestedBy: request.requestedBy,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedAppointments = [...appointments, newAppointment];
    await saveAppointments(updatedAppointments);

    const updatedRequests = estimateRequests.map(r =>
      r.id === requestId
        ? {
          ...r,
          status: "confirmed" as const,
          appointmentId: newAppointment.id,
          updatedAt: new Date().toISOString(),
        }
        : r
    );
    await saveEstimateRequests(updatedRequests);

    const notification: JobNotification = {
      id: `notif-${Date.now()}`,
      userId: request.requestedBy,
      jobId: request.jobId,
      applicationId: request.applicationId,
      appointmentId: newAppointment.id,
      type: "estimate_confirmed",
      title: "Estimate Confirmed",
      message: `${request.requestedFromName} confirmed estimate for ${job.title} on ${new Date(appointmentData.date).toLocaleDateString()} at ${appointmentData.time}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await addNotification(notification);

    return newAppointment;
  }, [appointments, estimateRequests, getJobById, saveAppointments, saveEstimateRequests, user, addNotification]);

  const createAppointment = useCallback(async (appointmentData: {
    title: string;
    contractorId: string;
    contractorName: string;
    contractorCompany: string;
    date: string;
    time: string;
    type: "estimate" | "site_visit" | "meeting";
    location: string;
    notes?: string;
    jobId?: string;
    applicationId?: string;
    entityType?: 'job' | 'project'; // Add entityType
  }) => {
    if (!user) return null;

    try {
      // Validate and Parse Date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentData.date)) {
        console.error("Invalid date format. Expected YYYY-MM-DD");
        Alert.alert("Error", "Please enter date in YYYY-MM-DD format");
        return null;
      }

      // Parse Time (Handle 12h and 24h)
      let time24 = appointmentData.time;
      if (time24.toLowerCase().includes('am') || time24.toLowerCase().includes('pm')) {
        const [timePart, modifier] = time24.toLowerCase().split(' ');
        let [hours, minutes] = timePart.split(':');
        if (hours === '12') {
          hours = '00';
        }
        if (modifier === 'pm') {
          hours = (parseInt(hours, 10) + 12).toString();
        }
        time24 = `${hours.padStart(2, '0')}:${minutes}`;
      } else if (time24.match(/^\d{1,2}:\d{2}$/)) {
        // Ensure HH is 2 digits
        const [h, m] = time24.split(':');
        time24 = `${h.padStart(2, '0')}:${m}`;
      } else {
        // Fallback or error
        console.warn("Ambiguous time format, using as-is or defaulting");
      }

      const startTime = `${appointmentData.date}T${time24}:00Z`;

      // Determine linkage based on entityType
      const isJob = appointmentData.entityType === 'job';
      // If entityType is not specified but jobId is present, we try to guess or fallback
      // But safe bet is: if we added entityType='job' in caller, use it.

      const payload: any = {
        title: appointmentData.title,
        description: appointmentData.notes,
        start_time: startTime,
        attendee_id: appointmentData.contractorId,
        status: "scheduled",
      };

      if (isJob && appointmentData.jobId) {
        payload.job_id = appointmentData.jobId;
        payload.project_id = null; // Explicitly null to avoid FK error
      } else if (appointmentData.jobId) {
        // Default behavior (likely Project or legacy)
        payload.project_id = appointmentData.jobId;
      }

      const apiResponse = await appointmentsAPI.create(payload);

      if (apiResponse.success && apiResponse.data) {
        const appt = apiResponse.data;
        const newAppointment: Appointment = {
          ...appointmentData,
          id: appt.id,
          status: appt.status,
          createdBy: appt.created_by,
          createdByName: user.fullName || "Me",
          createdAt: appt.created_at,
          updatedAt: appt.updated_at,
        };

        const updatedAppointments = [...appointments, newAppointment];
        setAppointments(updatedAppointments);
        await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updatedAppointments));

        if (appointmentData.jobId) {
          const job = getJobById(appointmentData.jobId);
          if (job) {
            const notification: JobNotification = {
              id: `notif-${Date.now()}`,
              userId: appointmentData.contractorId,
              jobId: appointmentData.jobId,
              applicationId: appointmentData.applicationId,
              appointmentId: newAppointment.id,
              type: "estimate_requested",
              title: `New ${appointmentData.type.replace('_', ' ')} Scheduled`,
              message: `${user.fullName || "User"} scheduled a ${appointmentData.type.replace('_', ' ')} for ${job.title}`,
              read: false,
              createdAt: new Date().toISOString(),
            };
            await addNotification(notification);
          }
        }

        return newAppointment;
      }
      return null;
    } catch (error) {
      console.error("Failed to create appointment via API:", error);
      return null;
    }
  }, [appointments, getJobById, user, addNotification]);

  const updateAppointment = useCallback(async (
    appointmentId: string,
    updates: Partial<Appointment>
  ) => {
    try {
      const backendUpdates: any = {};
      if (updates.status) backendUpdates.status = updates.status;
      if (updates.title) backendUpdates.title = updates.title;
      if (updates.notes) backendUpdates.description = updates.notes;
      if (updates.date && updates.time) {
        backendUpdates.start_time = `${updates.date}T${updates.time}:00Z`;
      }

      await appointmentsAPI.update(appointmentId, backendUpdates);

      const updatedAppointments = appointments.map(appt =>
        appt.id === appointmentId
          ? { ...appt, ...updates, updatedAt: new Date().toISOString() }
          : appt
      );
      setAppointments(updatedAppointments);
      await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updatedAppointments));

      const appointment = updatedAppointments.find(a => a.id === appointmentId);
      if (appointment && updates.status === "completed" && appointment.jobId) {
        const job = getJobById(appointment.jobId);
        if (job && appointment.requestedBy) {
          const notification: JobNotification = {
            id: `notif-${Date.now()}`,
            userId: appointment.requestedBy,
            jobId: appointment.jobId,
            applicationId: appointment.applicationId,
            appointmentId,
            type: "estimate_completed",
            title: "Estimate Completed",
            message: `${appointment.contractorName} completed the estimate for ${job.title}`,
            read: false,
            createdAt: new Date().toISOString(),
          };
          await addNotification(notification);
        }
      }
    } catch (error) {
      console.error("Failed to update appointment:", error);
    }
  }, [appointments, getJobById, addNotification]);

  const deleteAppointment = useCallback(async (appointmentId: string) => {
    try {
      await appointmentsAPI.delete(appointmentId);
      const updatedAppointments = appointments.filter(appt => appt.id !== appointmentId);
      setAppointments(updatedAppointments);
      await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    }
  }, [appointments]);

  const getAppointmentsByUserId = useCallback((userId: string) => {
    return appointments.filter(
      appt => appt.createdBy === userId || appt.contractorId === userId
    );
  }, [appointments]);

  const getAppointmentsByJobId = useCallback((jobId: string) => {
    return appointments.filter(appt => appt.jobId === jobId);
  }, [appointments]);

  const getEstimateRequestsByUserId = useCallback((userId: string) => {
    return estimateRequests.filter(
      req => req.requestedBy === userId || req.requestedFrom === userId
    );
  }, [estimateRequests]);

  const getUpcomingAppointments = useCallback(() => {
    if (!user) return [];
    const now = new Date();
    return appointments
      .filter(appt =>
        (appt.createdBy === user.id || appt.contractorId === user.id) &&
        appt.status === "scheduled" &&
        new Date(appt.date) >= now
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, user]);

  const getPendingEstimateRequests = useCallback(() => {
    if (!user) return [];
    return estimateRequests.filter(
      req => req.requestedFrom === user.id && req.status === "pending"
    );
  }, [estimateRequests, user]);

  return useMemo(() => ({
    appointments,
    estimateRequests,
    isLoading,
    requestEstimate,
    confirmEstimate,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByUserId,
    getAppointmentsByJobId,
    getEstimateRequestsByUserId,
    getUpcomingAppointments,
    getPendingEstimateRequests,
    refreshAppointments: loadData,
  }), [
    appointments,
    estimateRequests,
    isLoading,
    requestEstimate,
    confirmEstimate,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByUserId,
    getAppointmentsByJobId,
    getEstimateRequestsByUserId,
    getUpcomingAppointments,
    getPendingEstimateRequests,
    loadData,
  ]);
});
