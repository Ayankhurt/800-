import apiClient from "./client";
import { ApiResponse, Payment } from "./types";

/**
 * Payments & Escrow API
 * 
 * Endpoints:
 * - POST /payments/intent → create payment intent (Stripe)
 * - POST /projects/:id/payments/deposit → deposit funds
 * - POST /projects/:id/payments/:pid/release → release funds
 * - POST /payments/refund → refund payment
 */

export interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
  project_id?: string;
  description?: string;
}

export interface DepositData {
  amount: number;
  payment_method_id?: string;
  stripe_payment_intent_id?: string;
}

export interface ReleasePaymentData {
  amount?: number;
  milestone_id?: string;
}

export interface RefundData {
  payment_id: string;
  amount?: number;
  reason?: string;
}

const paymentsAPI = {
  /**
   * Create payment intent (Stripe)
   * POST /payments/intent
   */
  createIntent: async (data: CreatePaymentIntentData): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post("/payments/intent", data);
      return response.data;
    } catch (error: any) {
      console.error("Create payment intent API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: null };
      }
      throw error;
    }
  },

  /**
   * Deposit funds to escrow
   * POST /projects/:id/payments/deposit
   */
  deposit: async (projectId: string, data: DepositData): Promise<ApiResponse<Payment>> => {
    try {
      const response = await apiClient.post(`/projects/${projectId}/payments/deposit`, data);
      return response.data;
    } catch (error: any) {
      console.error("Deposit funds API error:", error);
      if (error.response?.status === 404) {
        // Fallback to generic payments endpoint
        const response = await apiClient.post("/payments", {
          project_id: projectId,
          type: "deposit",
          ...data,
        });
        return response.data;
      }
      throw error;
    }
  },

  /**
   * Release funds from escrow
   * POST /projects/:id/payments/:pid/release
   */
  release: async (projectId: string, paymentId: string, data?: ReleasePaymentData): Promise<ApiResponse<Payment>> => {
    try {
      const response = await apiClient.post(`/projects/${projectId}/payments/${paymentId}/release`, data || {});
      return response.data;
    } catch (error: any) {
      console.error("Release funds API error:", error);
      if (error.response?.status === 404) {
        // Fallback to update payment status
        const response = await apiClient.put(`/payments/${paymentId}`, {
          status: "released",
          ...data,
        });
        return response.data;
      }
      throw error;
    }
  },

  /**
   * Refund payment
   * POST /payments/refund
   */
  refund: async (data: RefundData): Promise<ApiResponse<Payment | null>> => {
    try {
      const response = await apiClient.post("/payments/refund", data);
      return response.data;
    } catch (error: any) {
      console.error("Refund payment API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: null };
      }
      throw error;
    }
  },

  /**
   * Get all payments
   * GET /payments
   */
  getAll: async (filters?: { project_id?: string; status?: string }): Promise<ApiResponse<Payment[]>> => {
    try {
      const params: any = {};
      if (filters?.project_id) params.project_id = filters.project_id;
      if (filters?.status) params.status = filters.status;

      const response = await apiClient.get("/payments", { params });
      return response.data;
    } catch (error: any) {
      console.error("Get payments API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },

  /**
   * Get payment by ID
   * GET /payments/:id
   */
  getById: async (id: string): Promise<ApiResponse<Payment>> => {
    try {
      const response = await apiClient.get(`/payments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Get payment by ID API error:", error);
      throw error;
    }
  },

  /**
   * Get project payments
   * GET /payments/projects/:projectId
   */
  getByProject: async (projectId: string): Promise<ApiResponse<Payment[]>> => {
    try {
      const response = await apiClient.get(`/payments/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error("Get project payments API error:", error);
      if (error.response?.status === 404) {
        return { success: false, message: "Endpoint not available", data: [] };
      }
      throw error;
    }
  },
};

export default paymentsAPI;




