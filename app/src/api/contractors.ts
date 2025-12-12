import apiClient from "./client";
import { ApiResponse, Contractor, PaginatedResponse, Review } from "./types";

/**
 * Contractors API
 * 
 * Endpoints:
 * - GET /contractors → contractor directory
 * - GET /contractors/:id → get contractor details
 * - GET /contractors/:id/reviews → get contractor reviews
 * - GET /contractors/:id/portfolio → get contractor portfolio
 * - POST /contractors/search → search contractors
 */

export interface ContractorFilters {
  trade?: string;
  rating_min?: number;
  verified?: boolean;
  licensed?: boolean;
  insured?: boolean;
  location?: string;
  limit?: number;
  offset?: number;
}

export interface SearchContractorsData {
  query: string;
  filters?: ContractorFilters;
}

const contractorsAPI = {
  /**
   * Get all contractors (directory)
   * GET /contractors
   */
  getAll: async (filters?: ContractorFilters): Promise<ApiResponse<PaginatedResponse<Contractor>>> => {
    try {
      const params: any = {};
      if (filters?.trade) params.trade = filters.trade;
      if (filters?.rating_min) params.rating_min = filters.rating_min;
      if (filters?.verified !== undefined) params.verified = filters.verified;
      if (filters?.licensed !== undefined) params.licensed = filters.licensed;
      if (filters?.insured !== undefined) params.insured = filters.insured;
      if (filters?.location) params.location = filters.location;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;

      const response = await apiClient.get("/contractors", { params });
      return response.data;
    } catch (error: any) {
      console.error("Get contractors API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: { data: [], total: 0 } };
      }
      throw error;
    }
  },

  /**
   * Get contractor by ID
   * GET /contractors/:id
   */
  getById: async (id: string): Promise<ApiResponse<Contractor>> => {
    try {
      const response = await apiClient.get(`/contractors/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get contractor by ID API error:", error);
      throw error;
    }
  },

  /**
   * Get contractor reviews
   * GET /contractors/:id/reviews or GET /reviews/contractors/:id
   */
  getReviews: async (contractorId: string): Promise<ApiResponse<Review[]>> => {
    try {
      let response;
      try {
        response = await apiClient.get(`/contractors/${contractorId}/reviews`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          response = await apiClient.get(`/reviews/contractors/${contractorId}`);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Get contractor reviews API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Get contractor portfolio
   * GET /contractors/:id/portfolio or GET /contractors/profiles/:userId
   */
  getPortfolio: async (contractorId: string): Promise<ApiResponse<any>> => {
    try {
      let response;
      try {
        response = await apiClient.get(`/contractors/${contractorId}/portfolio`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Try profile endpoint
          response = await apiClient.get(`/contractors/profiles/${contractorId}`);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Get contractor portfolio API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: null };
      }
      throw error;
    }
  },

  /**
   * Search contractors
   * POST /contractors/search or GET /contractors/search
   */
  search: async (data: SearchContractorsData): Promise<ApiResponse<Contractor[]>> => {
    try {
      let response;
      try {
        response = await apiClient.post("/contractors/search", {
          query: data.query,
          ...data.filters,
        });
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 405) {
          // Fallback to GET
          const params: any = { q: data.query };
          if (data.filters) {
            Object.assign(params, data.filters);
          }
          response = await apiClient.get("/contractors/search", { params });
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Search contractors API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },
};

export default contractorsAPI;




