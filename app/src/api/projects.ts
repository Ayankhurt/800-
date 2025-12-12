import apiClient from "./client";
import { ApiResponse, Project, PaginatedResponse } from "./types";

/**
 * Projects API
 * 
 * Endpoints:
 * - GET  /projects → project dashboard
 * - POST /projects → create project
 * - GET  /projects/:id → get project details
 * - PATCH /projects/:id → update project
 */

export interface CreateProjectData {
  title: string;
  description: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  contractor_id?: string;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

const projectsAPI = {
  /**
   * Get all projects (project dashboard)
   * GET /projects
   */
  getAll: async (filters?: { status?: string; limit?: number; offset?: number }): Promise<ApiResponse<PaginatedResponse<Project>>> => {
    try {
      const params: any = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await apiClient.get("/projects", { params });
      return response.data;
    } catch (error: any) {
      console.error("Get projects API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { data: [], total: 0 } };
      }
      throw error;
    }
  },

  /**
   * Get project by ID
   * GET /projects/:id
   */
  getById: async (id: string): Promise<ApiResponse<Project>> => {
    try {
      const response = await apiClient.get(`/projects/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get project by ID API error:", error);
      throw error;
    }
  },

  /**
   * Create a new project
   * POST /projects
   */
  create: async (data: CreateProjectData): Promise<ApiResponse<Project>> => {
    try {
      const response = await apiClient.post("/projects", data);
      return response.data;
    } catch (error: any) {
      console.error("Create project API error:", error);
      throw error;
    }
  },

  /**
   * Update project
   * PATCH /projects/:id or PUT /projects/:id
   */
  update: async (id: string, data: UpdateProjectData): Promise<ApiResponse<Project>> => {
    try {
      let response;
      try {
        response = await apiClient.patch(`/projects/${id}`, data);
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 405) {
          response = await apiClient.put(`/projects/${id}`, data);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Update project API error:", error);
      throw error;
    }
  },
};

export default projectsAPI;




