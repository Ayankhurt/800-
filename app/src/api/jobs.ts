import apiClient from "./client";
import { ApiResponse, Job, PaginatedResponse } from "./types";

/**
 * Jobs API
 * 
 * Endpoints:
 * - GET    /jobs → list jobs (with pagination)
 * - POST   /jobs → create job
 * - GET    /jobs/:id → get job details
 * - PATCH  /jobs/:id → update job
 * - POST   /jobs/:id/applications → apply to job
 * - GET    /jobs/:id/applications → get job applications
 */

export interface JobFilters {
  category?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  experience_level?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CreateJobData {
  title: string;
  description: string;
  category?: string;
  budget?: number;
  location?: string;
  experience_level?: string;
}

export interface ApplyToJobData {
  cover_letter?: string;
  proposed_rate?: number;
}

const jobsAPI = {
  /**
   * Get all jobs with pagination and filters
   * GET /jobs
   */
  getAll: async (filters?: JobFilters): Promise<ApiResponse<PaginatedResponse<Job>>> => {
    try {
      const params: any = {};
      if (filters?.category) params.category = filters.category;
      if (filters?.budget_min) params.budget_min = filters.budget_min;
      if (filters?.budget_max) params.budget_max = filters.budget_max;
      if (filters?.location) params.location = filters.location;
      if (filters?.experience_level) params.experience_level = filters.experience_level;
      if (filters?.status) params.status = filters.status;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await apiClient.get("/jobs", { params });
      return response.data;
    } catch (error: any) {
      console.error("Get jobs API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { data: [], total: 0 } };
      }
      throw error;
    }
  },

  /**
   * Get job by ID
   * GET /jobs/:id
   */
  getById: async (id: string): Promise<ApiResponse<Job>> => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get job by ID API error:", error);
      throw error;
    }
  },

  /**
   * Create a new job
   * POST /jobs
   */
  create: async (data: CreateJobData): Promise<ApiResponse<Job>> => {
    try {
      const response = await apiClient.post("/jobs", data);
      return response.data;
    } catch (error: any) {
      console.error("Create job API error:", error);
      throw error;
    }
  },

  /**
   * Update job
   * PATCH /jobs/:id or PUT /jobs/:id
   */
  update: async (id: string, data: Partial<CreateJobData>): Promise<ApiResponse<Job>> => {
    try {
      let response;
      try {
        response = await apiClient.patch(`/jobs/${id}`, data);
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 405) {
          response = await apiClient.put(`/jobs/${id}`, data);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Update job API error:", error);
      throw error;
    }
  },

  /**
   * Apply to a job
   * POST /jobs/:id/apply
   */
  apply: async (jobId: string, data?: ApplyToJobData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(`/jobs/${jobId}/apply`, data || {});
      return response.data;
    } catch (error: any) {
      console.error("Apply to job API error:", error);
      throw error;
    }
  },

  /**
   * Get job applications
   * GET /jobs/:id/applications
   */
  getApplications: async (jobId: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiClient.get(`/jobs/${jobId}/applications`);
      return response.data;
    } catch (error: any) {
      console.error("Get job applications API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Search jobs
   * GET /jobs/search
   */
  search: async (query: string): Promise<ApiResponse<Job[]>> => {
    try {
      const response = await apiClient.get("/jobs/search", {
        params: { query },
      });
      return response.data;
    } catch (error: any) {
      console.error("Search jobs API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },
};

export default jobsAPI;




