import apiClient, { setAccessToken, setRefreshToken, clearTokens, getRefreshToken } from "./client";

import { User, ApiResponse } from "./types";

/**
 * Authentication API
 * 
 * Endpoints:
 * - POST /auth/register → register user
 * - POST /auth/login → login with OTP (if MFA enabled)
 * - POST /auth/send-otp → send OTP to phone/email
 * - POST /auth/verify-otp → verify OTP and return tokens
 * - GET  /auth/me → fetch logged-in user profile
 * - PATCH /auth/profile → update profile
 * - POST /auth/logout → revoke token
 */

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role_code?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyOtpData {
  temp_token: string;
  otp: string;
}

export interface SendOtpData {
  email?: string;
  phone?: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string;
  company_name?: string;
}

const authAPI = {
  /**
   * Register a new user
   * POST /auth/signup
   */
  register: async (data: RegisterData): Promise<ApiResponse<{ user: User; token: string; access_token: string; refresh_token: string }>> => {
    try {
      const response = await apiClient.post("/auth/signup", {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role_code: data.role_code || "VIEWER",
        phone: data.phone,
      });

      const result = response.data;
      
      // Store tokens
      if (result.data?.access_token) {
        await setAccessToken(result.data.access_token);
      } else if (result.data?.token) {
        await setAccessToken(result.data.token);
      }
      
      if (result.data?.refresh_token) {
        await setRefreshToken(result.data.refresh_token);
      }

      return result;
    } catch (error: any) {
      console.error("Register API error:", error);
      throw error;
    }
  },

  /**
   * Login with email and password
   * POST /auth/login
   * Returns tokens or MFA required response
   */
  login: async (data: LoginData): Promise<ApiResponse<{ 
    user?: User; 
    token?: string; 
    access_token?: string; 
    refresh_token?: string;
    mfa_required?: boolean;
    temp_token?: string;
    email?: string;
  }>> => {
    try {
      const response = await apiClient.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const result = response.data;

      // If MFA is required, return early without storing tokens
      if (result.data?.mfa_required) {
        return result;
      }

      // Store tokens if login successful
      if (result.data?.access_token) {
        await setAccessToken(result.data.access_token);
      } else if (result.data?.token) {
        await setAccessToken(result.data.token);
      }
      
      if (result.data?.refresh_token) {
        await setRefreshToken(result.data.refresh_token);
      }

      return result;
    } catch (error: any) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  /**
   * Send OTP to email or phone
   * POST /auth/send-otp
   * Note: Backend may send OTP automatically during login if MFA is enabled
   */
  sendOtp: async (data: SendOtpData): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post("/auth/send-otp", {
        email: data.email,
        phone: data.phone,
      });
      return response.data;
    } catch (error: any) {
      console.error("Send OTP API error:", error);
      throw error;
    }
  },

  /**
   * Verify OTP and get tokens
   * POST /auth/verify-otp
   */
  verifyOtp: async (data: VerifyOtpData): Promise<ApiResponse<{ 
    user: User; 
    token: string; 
    access_token: string; 
    refresh_token: string;
  }>> => {
    try {
      const response = await apiClient.post("/auth/verify-otp", {
        temp_token: data.temp_token,
        otp: data.otp,
      });

      const result = response.data;

      // Store tokens
      if (result.data?.access_token) {
        await setAccessToken(result.data.access_token);
      } else if (result.data?.token) {
        await setAccessToken(result.data.token);
      }
      
      if (result.data?.refresh_token) {
        await setRefreshToken(result.data.refresh_token);
      }

      return result;
    } catch (error: any) {
      console.error("Verify OTP API error:", error);
      throw error;
    }
  },

  /**
   * Get current user profile
   * GET /auth/me or GET /users/me
   */
  me: async (): Promise<ApiResponse<User>> => {
    try {
      // Try /auth/me first, fallback to /users/me
      let response;
      try {
        response = await apiClient.get("/auth/me");
      } catch (error: any) {
        if (error.response?.status === 404) {
          response = await apiClient.get("/users/me");
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Get profile API error:", error);
      throw error;
    }
  },

  /**
   * Update user profile
   * PATCH /auth/profile or PUT /auth/update-profile or PUT /users/update
   */
  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<User>> => {
    try {
      // Try multiple endpoints
      let response;
      try {
        response = await apiClient.patch("/auth/profile", {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          avatar: data.avatar,
          company_name: data.company_name,
        });
      } catch (error: any) {
        if (error.response?.status === 404) {
          try {
            response = await apiClient.put("/auth/update-profile", {
              first_name: data.first_name,
              last_name: data.last_name,
              phone: data.phone,
              avatar: data.avatar,
              company_name: data.company_name,
            });
          } catch (error2: any) {
            if (error2.response?.status === 404) {
              response = await apiClient.put("/users/update", {
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                avatar: data.avatar,
                company_name: data.company_name,
              });
            } else {
              throw error2;
            }
          }
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Update profile API error:", error);
      throw error;
    }
  },

  /**
   * Refresh access token
   * POST /auth/refresh-token
   */
  refresh: async (): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiClient.post("/auth/refresh-token", {
        refresh_token: refreshToken,
      });

      const result = response.data;

      // Store new tokens
      if (result.data?.access_token) {
        await setAccessToken(result.data.access_token);
      }
      if (result.data?.refresh_token) {
        await setRefreshToken(result.data.refresh_token);
      }

      return result;
    } catch (error: any) {
      console.error("Refresh token API error:", error);
      // Clear tokens on refresh failure
      await clearTokens();
      throw error;
    }
  },

  /**
   * Logout user and revoke token
   * POST /auth/logout
   * Requires refresh_token in body
   */
  logout: async (): Promise<void> => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiClient.post("/auth/logout", {
          refresh_token: refreshToken,
        });
      }
    } catch (error: any) {
      console.warn("Backend logout failed:", error?.response?.status || error?.message);
    } finally {
      // Always clear tokens locally
      await clearTokens();
    }
  },
};

export default authAPI;
