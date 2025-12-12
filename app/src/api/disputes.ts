import apiClient from "./client";
import { ApiResponse, Dispute, PaginatedResponse } from "./types";

/**
 * Disputes API
 * 
 * Endpoints:
 * - POST /disputes → file dispute
 * - GET  /projects/:id/disputes → get project disputes
 * - POST /disputes/:id/respond → respond to dispute
 */

export interface FileDisputeData {
  project_id: string;
  title: string;
  description: string;
  evidence?: string[];
  images?: string[];
  videos?: string[];
}

export interface RespondToDisputeData {
  message: string;
  evidence?: string[];
  images?: string[];
  videos?: string[];
}

const disputesAPI = {
  /**
   * Get all disputes
   * GET /disputes
   */
  getAll: async (filters?: { status?: string; limit?: number; offset?: number }): Promise<ApiResponse<PaginatedResponse<Dispute>>> => {
    try {
      const params: any = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await apiClient.get("/disputes", { params });
      return response.data;
    } catch (error: any) {
      console.error("Get disputes API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { data: [], total: 0 } };
      }
      throw error;
    }
  },

  /**
   * Get dispute by ID
   * GET /disputes/:id
   */
  getById: async (id: string): Promise<ApiResponse<Dispute>> => {
    try {
      const response = await apiClient.get(`/disputes/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get dispute by ID API error:", error);
      throw error;
    }
  },

  /**
   * File a dispute
   * POST /disputes
   */
  create: async (data: FileDisputeData): Promise<ApiResponse<Dispute>> => {
    try {
      const response = await apiClient.post("/disputes", data);
      return response.data;
    } catch (error: any) {
      console.error("File dispute API error:", error);
      throw error;
    }
  },

  /**
   * Get project disputes
   * GET /projects/:id/disputes or GET /disputes/projects/:projectId
   */
  getByProject: async (projectId: string): Promise<ApiResponse<Dispute[]>> => {
    try {
      let response;
      try {
        response = await apiClient.get(`/projects/${projectId}/disputes`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          response = await apiClient.get(`/disputes/projects/${projectId}`);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Get project disputes API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Respond to dispute
   * POST /disputes/:id/respond or POST /disputes/:id/messages
   */
  respond: async (disputeId: string, data: RespondToDisputeData): Promise<ApiResponse> => {
    try {
      let response;
      try {
        response = await apiClient.post(`/disputes/${disputeId}/respond`, data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          response = await apiClient.post(`/disputes/${disputeId}/messages`, data);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Respond to dispute API error:", error);
      throw error;
    }
  },

  /**
   * Update dispute status
   * PUT /disputes/:id/status or PATCH /disputes/:id
   */
  updateStatus: async (disputeId: string, status: string): Promise<ApiResponse<Dispute>> => {
    try {
      let response;
      try {
        response = await apiClient.put(`/disputes/${disputeId}/status`, { status });
      } catch (error: any) {
        if (error.response?.status === 404) {
          response = await apiClient.patch(`/disputes/${disputeId}`, { status });
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Update dispute status API error:", error);
      throw error;
    }
  },
};

export default disputesAPI;




