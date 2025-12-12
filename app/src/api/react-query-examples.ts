/**
 * React Query Examples for BidRoom API
 * 
 * This file demonstrates how to use React Query with the new API structure
 * for caching, pagination, and optimistic updates.
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  jobsAPI, 
  bidsAPI, 
  contractorsAPI, 
  projectsAPI,
  authAPI,
  messagesAPI,
  notificationsAPI,
} from './index';
import type { Job, Bid, Contractor, Project, ApiResponse, PaginatedResponse } from './types';

// ============================================
// JOBS
// ============================================

/**
 * Get jobs with filters and pagination
 */
export function useJobs(filters?: {
  category?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsAPI.getAll(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Infinite scroll for jobs
 */
export function useJobsInfinite(filters?: { category?: string; location?: string }) {
  return useInfiniteQuery<ApiResponse<PaginatedResponse<Job>>, Error>({
    queryKey: ['jobs', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => 
      jobsAPI.getAll({ ...filters, limit: 20, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const total = lastPage.data?.total || 0;
      const loaded = pages.reduce((sum, page) => 
        sum + (page.data?.data?.length || 0), 0
      );
      return loaded < total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
  });
}

/**
 * Get single job
 */
export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsAPI.getById(jobId!),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create job mutation
 */
export function useCreateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: jobsAPI.create,
    onSuccess: () => {
      // Invalidate jobs list to refetch
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

/**
 * Apply to job mutation
 */
export function useApplyToJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data?: any }) => 
      jobsAPI.apply(jobId, data),
    onSuccess: (_, variables) => {
      // Invalidate job details and applications
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId, 'applications'] });
    },
  });
}

// ============================================
// BIDS
// ============================================

/**
 * Get bids for a job
 */
export function useBidsByJob(jobId: string | null) {
  return useQuery({
    queryKey: ['bids', 'job', jobId],
    queryFn: () => bidsAPI.getByJob(jobId!),
    enabled: !!jobId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create bid mutation
 */
export function useCreateBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: bidsAPI.create,
    onSuccess: (_, variables) => {
      // Invalidate bids for the job
      queryClient.invalidateQueries({ queryKey: ['bids', 'job', variables.job_id] });
    },
  });
}

// ============================================
// CONTRACTORS
// ============================================

/**
 * Get contractors with filters
 */
export function useContractors(filters?: {
  trade?: string;
  rating_min?: number;
  verified?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['contractors', filters],
    queryFn: () => contractorsAPI.getAll(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get contractor details
 */
export function useContractor(contractorId: string | null) {
  return useQuery({
    queryKey: ['contractor', contractorId],
    queryFn: () => contractorsAPI.getById(contractorId!),
    enabled: !!contractorId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get contractor reviews
 */
export function useContractorReviews(contractorId: string | null) {
  return useQuery({
    queryKey: ['contractor', contractorId, 'reviews'],
    queryFn: () => contractorsAPI.getReviews(contractorId!),
    enabled: !!contractorId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// PROJECTS
// ============================================

/**
 * Get user projects
 */
export function useProjects(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectsAPI.getAll(filters),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get project details
 */
export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.getById(projectId!),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute (projects change frequently)
  });
}

// ============================================
// AUTH
// ============================================

/**
 * Get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => authAPI.me(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry on 401
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: () => {
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
}

// ============================================
// MESSAGES
// ============================================

/**
 * Get conversations
 */
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.getConversations(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  });
}

/**
 * Get messages for a conversation
 */
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesAPI.getMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

/**
 * Send message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: messagesAPI.send,
    onSuccess: (_, variables) => {
      // Invalidate messages for the conversation
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversation_id] });
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Get notifications
 */
export function useNotifications(filters?: { read?: boolean }) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationsAPI.getAll(filters),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Mark notification as read mutation
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsAPI.markAsRead,
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

// ============================================
// OPTIMISTIC UPDATES EXAMPLE
// ============================================

/**
 * Example: Optimistic update for marking notification as read
 */
export function useMarkNotificationAsReadOptimistic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsAPI.markAsRead,
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(['notifications']);
      
      // Optimistically update
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((n: any) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
          },
        };
      });
      
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

