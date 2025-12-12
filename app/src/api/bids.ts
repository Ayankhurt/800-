import apiClient from "./client";
import { ApiResponse, Bid, PaginatedResponse } from "./types";

/**
 * Bids API
 * 
 * Endpoints:
 * - POST /bids → submit bid
 * - GET  /bids/:id → get bid details
 * - PATCH /bids/:id → edit bid
 * - GET  /jobs/:id/bids → view all bids on a job
 */

export interface CreateBidData {
  job_id: string;
  amount: number;
  description?: string;
  estimated_completion_date?: string;
}

export interface UpdateBidData {
  amount?: number;
  description?: string;
  estimated_completion_date?: string;
  status?: string;
}

const bidsAPI = {
  /**
   * Get all bids (with optional filters)
   * GET /bids
   */
  getAll: async (filters?: { job_id?: string; status?: string; limit?: number; offset?: number }): Promise<ApiResponse<PaginatedResponse<Bid>>> => {
    try {
      const params: any = {};
      if (filters?.job_id) params.job_id = filters.job_id;
      if (filters?.status) params.status = filters.status;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await apiClient.get("/bids", { params });
      return response.data;
    } catch (error: any) {
      console.error("Get bids API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { data: [], total: 0 } };
      }
      throw error;
    }
  },

  /**
   * Get bid by ID
   * GET /bids/:id
   */
  getById: async (id: string): Promise<ApiResponse<Bid>> => {
    try {
      const response = await apiClient.get(`/bids/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get bid by ID API error:", error);
      throw error;
    }
  },

  /**
   * Submit a bid
   * POST /bids
   */
  create: async (data: CreateBidData): Promise<ApiResponse<Bid>> => {
    try {
      const response = await apiClient.post("/bids", data);
      return response.data;
    } catch (error: any) {
      console.error("Create bid API error:", error);
      throw error;
    }
  },

  /**
   * Edit/update a bid
   * PATCH /bids/:id or PUT /bids/:id
   */
  update: async (id: string, data: UpdateBidData): Promise<ApiResponse<Bid>> => {
    try {
      let response;
      try {
        response = await apiClient.patch(`/bids/${id}`, data);
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 405) {
          response = await apiClient.put(`/bids/${id}`, data);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Update bid API error:", error);
      throw error;
    }
  },

  /**
   * Get all bids for a job
   * GET /jobs/:id/bids or GET /bids?job_id=:id
   */
  getByJob: async (jobId: string): Promise<ApiResponse<Bid[]>> => {
    try {
      let response;
      try {
        response = await apiClient.get(`/jobs/${jobId}/bids`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Fallback to query parameter
          response = await apiClient.get("/bids", {
            params: { job_id: jobId },
          });
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Get bids by job API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Submit bid submission
   * POST /bids/:bidId/submit
   */
  submit: async (bidId: string, data?: any): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post(`/bids/${bidId}/submit`, data || {});
      return response.data;
    } catch (error: any) {
      console.error("Submit bid API error:", error);
      throw error;
    }
  },

  /**
   * Compare bids for a job
   * GET /bids/:jobId/compare
   */
  compare: async (jobId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(`/bids/${jobId}/compare`);
      return response.data;
    } catch (error: any) {
      console.error("Compare bids API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: null };
      }
      throw error;
    }
  },
};

export default bidsAPI;




