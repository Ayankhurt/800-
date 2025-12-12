import apiClient from "./client";
import { ApiResponse, Review, PaginatedResponse } from "./types";

/**
 * Reviews API
 * 
 * Endpoints:
 * - POST /reviews → post review
 * - GET  /reviews/:user_id → get reviews by user
 */

export interface CreateReviewData {
  contractor_id: string;
  project_id?: string;
  rating: number;
  comment?: string;
}

const reviewsAPI = {
  /**
   * Get reviews by user ID
   * GET /reviews/:userId
   */
  getByUserId: async (userId: string): Promise<ApiResponse<Review[]>> => {
    try {
      const response = await apiClient.get(`/reviews/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error("Get reviews by user ID API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Get contractor reviews
   * GET /reviews/contractors/:contractorId
   */
  getByContractor: async (contractorId: string): Promise<ApiResponse<Review[]>> => {
    try {
      const response = await apiClient.get(`/reviews/contractors/${contractorId}`);
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
   * Get review by ID
   * GET /reviews/:id
   */
  getById: async (id: string): Promise<ApiResponse<Review>> => {
    try {
      const response = await apiClient.get(`/reviews/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get review by ID API error:", error);
      throw error;
    }
  },

  /**
   * Post a review
   * POST /reviews
   */
  create: async (data: CreateReviewData): Promise<ApiResponse<Review>> => {
    try {
      const response = await apiClient.post("/reviews", data);
      return response.data;
    } catch (error: any) {
      console.error("Create review API error:", error);
      throw error;
    }
  },

  /**
   * Add response to review
   * POST /reviews/:id/response
   */
  addResponse: async (reviewId: string, responseText: string): Promise<ApiResponse<Review>> => {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/response`, {
        response: responseText,
      });
      return response.data;
    } catch (error: any) {
      console.error("Add review response API error:", error);
      throw error;
    }
  },
};

export default reviewsAPI;




