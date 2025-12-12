import apiClient from "./client";
import { ApiResponse, Milestone } from "./types";

/**
 * Milestones API
 * 
 * Endpoints:
 * - POST /milestones/:id/submit → submit milestone
 * - GET  /projects/:id/milestones → get project milestones
 * - POST /progress-updates → submit progress update
 */

export interface CreateMilestoneData {
  title: string;
  description?: string;
  amount?: number;
  due_date?: string;
}

export interface SubmitMilestoneData {
  images?: string[];
  videos?: string[];
  description?: string;
  progress_percentage?: number;
}

export interface ProgressUpdateData {
  project_id: string;
  milestone_id?: string;
  description: string;
  images?: string[];
  videos?: string[];
  progress_percentage?: number;
}

const milestonesAPI = {
  /**
   * Get project milestones
   * GET /milestones/projects/:projectId
   */
  getByProject: async (projectId: string): Promise<ApiResponse<Milestone[]>> => {
    try {
      const response = await apiClient.get(`/milestones/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error("Get milestones by project API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Get milestone by ID
   * GET /milestones/:id
   */
  getById: async (id: string): Promise<ApiResponse<Milestone>> => {
    try {
      const response = await apiClient.get(`/milestones/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get milestone by ID API error:", error);
      throw error;
    }
  },

  /**
   * Create milestone
   * POST /milestones/projects/:projectId
   */
  create: async (projectId: string, data: CreateMilestoneData): Promise<ApiResponse<Milestone>> => {
    try {
      const response = await apiClient.post(`/milestones/projects/${projectId}`, data);
      return response.data;
    } catch (error: any) {
      console.error("Create milestone API error:", error);
      throw error;
    }
  },

  /**
   * Update milestone
   * PUT /milestones/:id
   */
  update: async (id: string, data: Partial<CreateMilestoneData>): Promise<ApiResponse<Milestone>> => {
    try {
      const response = await apiClient.put(`/milestones/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error("Update milestone API error:", error);
      throw error;
    }
  },

  /**
   * Submit milestone
   * POST /milestones/:id/submit
   */
  submit: async (milestoneId: string, data?: SubmitMilestoneData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(`/milestones/${milestoneId}/submit`, data || {});
      return response.data;
    } catch (error: any) {
      console.error("Submit milestone API error:", error);
      throw error;
    }
  },

  /**
   * Approve milestone
   * POST /milestones/:id/approve
   */
  approve: async (milestoneId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(`/milestones/${milestoneId}/approve`);
      return response.data;
    } catch (error: any) {
      console.error("Approve milestone API error:", error);
      throw error;
    }
  },

  /**
   * Submit progress update
   * POST /progress-updates
   */
  submitProgressUpdate: async (data: ProgressUpdateData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post("/progress-updates", data);
      return response.data;
    } catch (error: any) {
      console.error("Submit progress update API error:", error);
      throw error;
    }
  },

  /**
   * Get project progress updates
   * GET /progress-updates/projects/:projectId
   */
  getProgressUpdates: async (projectId: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiClient.get(`/progress-updates/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error("Get progress updates API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },
};

export default milestonesAPI;




