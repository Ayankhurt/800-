import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Job,
  JobApplication,
  JobMessage,
  JobNotification,
  ApplicationStatus,
  UserRole,
} from "@/types";
// Mock data removed - app now uses 100% real API data
import { useAuth } from "./AuthContext";
import { jobsAPI, messagesAPI, invitesAPI, notificationsAPI } from "@/services/api";

const STORAGE_KEYS = {
  JOBS: "jobs",
  APPLICATIONS: "applications",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
};

export const [JobsProvider, useJobs] = createContextHook(() => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [messages, setMessages] = useState<JobMessage[]>([]);
  const [notifications, setNotifications] = useState<JobNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setJobs([]);
      setApplications([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetch from API
      const [jobsResponse] = await Promise.all([
        jobsAPI.getAll(),
        // Since there is no specific 'my-applications' for jobs yet, 
        // we might rely on fetching all or per-job. 
        // But for now, let's at least get the jobs list.
      ]);

      if (jobsResponse.success && jobsResponse.data) {
        const jobsArray = jobsResponse.data.jobs || (Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
        const mappedJobs = jobsArray.map((job: any) => ({
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
          requirements: job.requirements || [],
        }));
        setJobs(mappedJobs);
      }
    } catch (error) {
      console.error("[JobsContext] Failed to load jobs data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createJob = useCallback(async (jobData: any) => {
    try {
      const response = await jobsAPI.create(jobData);
      if (response.success) {
        await loadData();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("[JobsContext] Create job failed:", error);
      return null;
    }
  }, [loadData]);

  const updateJob = useCallback(async (jobId: string, updates: Partial<Job>) => {
    try {
      const response = await jobsAPI.update(jobId, updates);
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error("[JobsContext] Update job failed:", error);
    }
  }, [loadData]);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      const response = await jobsAPI.delete(jobId);
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error("[JobsContext] Delete job failed:", error);
    }
  }, [loadData]);

  const applyToJob = useCallback(async (jobId: string, data: any) => {
    try {
      const response = await jobsAPI.apply(jobId, data);
      if (response.success) {
        await loadData();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("[JobsContext] Apply to job failed:", error);
      return null;
    }
  }, [loadData]);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    try {
      const response = await jobsAPI.updateApplicationStatus(applicationId, status);
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error("[JobsContext] Update application status failed:", error);
    }
  }, [loadData]);

  const inviteContractor = useCallback(async (jobId: string, contractorId: string, message?: string) => {
    try {
      const response = await invitesAPI.invite({
        job_id: jobId,
        contractor_id: contractorId,
        message
      });
      return response.success;
    } catch (error) {
      console.error("[JobsContext] Invite contractor failed:", error);
      return false;
    }
  }, []);

  const addNotification = useCallback(async (notificationData: any) => {
    // This is a local-only or mock implementation if needed
    // In a real app, notifications are usually sent by the backend as a side effect
    // But since InviteModal uses it, we'll keep it for compatibility.
    console.log("[JobsContext] Manual notification add (usually backend handled):", notificationData);
    setNotifications(prev => [notificationData, ...prev]);
  }, []);

  const sendMessage = useCallback(async (jobId: string, receiverId: string, content: string, applicationId?: string) => {
    try {
      console.log("[JobsContext] Sending message via API...");
      const response = await messagesAPI.send({
        receiver_id: receiverId,
        content,
        job_id: jobId,
        // application_id: applicationId, // Backend might not support this yet, but we have it
      });

      if (response.success) {
        // Refresh messages if needed, or just update local state
        const newMessage: JobMessage = {
          id: response.data?.id || `msg-${Date.now()}`,
          jobId,
          applicationId,
          senderId: user?.id || "",
          senderName: user?.fullName || "",
          receiverId,
          message: content,
          sentAt: new Date().toISOString(),
          read: false,
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
      }
      return null;
    } catch (error) {
      console.error("[JobsContext] Send message failed:", error);
      return null;
    }
  }, [user]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, read: true } : msg));
  }, []);

  const getJobById = useCallback((jobId: string) => {
    return jobs.find(job => job.id === jobId);
  }, [jobs]);

  const getApplicationsByJobId = useCallback((jobId: string) => {
    return applications.filter(app => app.jobId === jobId);
  }, [applications]);

  const getApplicationsByUserId = useCallback((userId: string) => {
    return applications.filter(app => app.applicantId === userId);
  }, [applications]);

  const getMessagesByJobId = useCallback((jobId: string) => {
    return messages.filter(msg => msg.jobId === jobId);
  }, [messages]);

  const getUnreadNotificationsCount = useCallback(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);

  const getUserNotifications = useCallback(() => {
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  return useMemo(() => ({
    jobs,
    applications,
    messages,
    notifications,
    isLoading,
    createJob,
    updateJob,
    deleteJob,
    applyToJob,
    inviteContractor,
    addNotification,
    updateApplicationStatus,
    sendMessage,
    markMessageAsRead,
    getJobById,
    getApplicationsByJobId,
    getApplicationsByUserId,
    getMessagesByJobId,
    getUnreadNotificationsCount,
    getUserNotifications,
    refreshJobs: loadData,
  }), [
    jobs,
    applications,
    messages,
    notifications,
    isLoading,
    createJob,
    updateJob,
    deleteJob,
    applyToJob,
    inviteContractor,
    addNotification,
    updateApplicationStatus,
    sendMessage,
    markMessageAsRead,
    getJobById,
    getApplicationsByJobId,
    getApplicationsByUserId,
    getMessagesByJobId,
    getUnreadNotificationsCount,
    getUserNotifications,
    loadData,
  ]);
});
