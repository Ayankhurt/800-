import axios, { AxiosInstance, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_CONFIG } from "@/config/api";

// Check if we're on web platform
const isWeb = Platform.OS === "web";

const BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log base URL in development for debugging
if (__DEV__) {
  console.log("🌐 API Base URL:", BASE_URL);
  console.log("📱 Platform:", Platform.OS);
  console.log("🔧 Config Source:",
    process.env.EXPO_PUBLIC_API_URL ? "EXPO_PUBLIC_API_URL" :
      process.env.EXPO_PUBLIC_API_IP ? "EXPO_PUBLIC_API_IP + EXPO_PUBLIC_API_PORT" :
        "Default hardcoded values"
  );
}

// Token storage keys
const TOKEN_KEY = "auth_token";

// Set auth token in axios header
export const setAuthToken = async (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // Use localStorage for web, SecureStore for native
    if (isWeb) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch (error) {
        console.error("Error saving token to localStorage:", error);
      }
    } else {
      try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } catch (error) {
        console.error("Error saving token to SecureStore:", error);
      }
    }
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
    // Remove from storage
    if (isWeb) {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (error) {
        console.error("Error removing token from localStorage:", error);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (error) {
        console.error("Error removing token from SecureStore:", error);
      }
    }
  }
};

// Get stored token
export const getStoredToken = async (): Promise<string | null> => {
  try {
    // Use localStorage for web, SecureStore for native
    if (isWeb) {
      // localStorage is synchronous, but we keep async for consistency
      const token = localStorage.getItem(TOKEN_KEY);
      return token;
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    // Silently handle errors - token might not exist
    // Don't log errors for missing tokens (normal on first load)
    return null;
  }
};

// Request interceptor - attach token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle network errors
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      console.error("Network Error:", {
        message: error.message,
        code: error.code,
        baseURL: BASE_URL,
        platform: Platform.OS,
      });

      // Extract base URL without /api/v1 for testing
      const baseUrlForTest = BASE_URL.replace('/api/v1', '').replace('/api', '');

      // Provide helpful error message with actual configured URL
      const networkError = new Error(
        `Cannot connect to server at ${BASE_URL}\n\n` +
        `Please check:\n` +
        `1. Backend server is running: cd backend && npm start\n` +
        `2. Backend is accessible at ${baseUrlForTest}\n` +
        `3. Test in browser: ${baseUrlForTest}/api/health\n` +
        `4. Firewall allows connections on port 5000\n` +
        `5. Both devices are on the same network\n` +
        `6. Environment variable: ${process.env.EXPO_PUBLIC_API_URL ? 'EXPO_PUBLIC_API_URL is set' : 'Using default config'}`
      );
      return Promise.reject(networkError);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token
      await setAuthToken(null);
    }

    // Suppress 404 error logging - individual API functions will handle them gracefully
    // This prevents console spam for missing endpoints
    if (error.response?.status === 404) {
      // Don't log 404s here - let individual functions handle them silently
      // Just reject so catch blocks can handle it
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Login
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  // Signup
  signup: async (data: {
    fullName: string;
    email?: string;
    password: string;
    role: string;
    // Role-specific fields
    companyName?: string;
    tradeSpecialization?: string;
    yearsExperience?: string;
    licenseNumber?: string;
    licenseType?: string;
    insuranceDetails?: string;
    location?: string;
    portfolio?: string;
    certifications?: string;
    projectType?: string;
  }) => {
    try {
      // Backend expects: first_name, last_name, role (NOT full_name, role_code)

      // Split fullName into first_name and last_name
      const nameParts = data.fullName.trim().split(/\s+/);
      const first_name = nameParts[0];
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

      // Map frontend role codes to backend database enum values
      const roleMapping: Record<string, string> = {
        'PM': 'project_manager',
        'GC': 'general_contractor',
        'SUB': 'subcontractor',
        'TS': 'trade_specialist',
        'VIEWER': 'viewer',
        'ADMIN': 'admin'
      };

      const mappedRole = roleMapping[data.role] || data.role.toLowerCase();

      const backendData: any = {
        email: data.email,
        password: data.password,
        first_name: first_name,
        last_name: last_name,
        role: mappedRole, // Use mapped database enum value
      };

      // Add role-specific optional fields
      if (data.companyName) backendData.company_name = data.companyName;
      if (data.tradeSpecialization) backendData.trade_specialization = data.tradeSpecialization;
      if (data.yearsExperience) backendData.years_experience = data.yearsExperience;
      if (data.licenseNumber) backendData.license_number = data.licenseNumber;
      if (data.licenseType) backendData.license_type = data.licenseType;
      if (data.insuranceDetails) backendData.insurance_provider = data.insuranceDetails;
      if (data.location) backendData.location = data.location;
      if (data.portfolio) backendData.portfolio = data.portfolio;
      if (data.certifications) backendData.certifications = data.certifications;
      if (data.projectType) backendData.projectType = data.projectType;

      // Log the data being sent for debugging
      console.log("Signup request data (mapped):", { ...backendData, password: "***" });

      const response = await apiClient.post("/auth/signup", backendData);
      return response.data;
    } catch (error: any) {
      console.error("Signup API error:", error);

      // Extract detailed error message from backend
      let errorMessage = "Registration failed. Please try again.";

      if (error.response) {
        // Backend responded with error
        const status = error.response.status;
        const backendError = error.response.data;

        console.error("Backend error response:", {
          status,
          data: backendError,
          message: backendError?.message,
          errors: backendError?.errors,
        });

        if (backendError?.message) {
          errorMessage = backendError.message;
        } else if (backendError?.errors && Array.isArray(backendError.errors)) {
          // Handle validation errors array
          errorMessage = backendError.errors.map((err: any) => err.message || err).join(", ");
        } else if (backendError?.error) {
          errorMessage = backendError.error;
        } else if (status === 400) {
          errorMessage = "Invalid data provided. Please check all fields and try again.";
        } else if (status === 409) {
          errorMessage = "Email already exists. Please use a different email or login instead.";
        } else if (status === 422) {
          errorMessage = "Validation failed. Please check all fields are correct.";
        }
      } else if (error.message && error.message.includes("Network Error")) {
        const baseUrlForTest = BASE_URL.replace('/api/v1', '').replace('/api', '');
        errorMessage = `Cannot connect to backend server at ${BASE_URL}\n\n` +
          `Please check:\n` +
          `1. Backend server is running: cd backend && npm start\n` +
          `2. Backend is accessible at ${baseUrlForTest}\n` +
          `3. Test in browser: ${baseUrlForTest}/api/health\n` +
          `4. Firewall allows connections on port 5000\n` +
          `5. Both devices are on the same network\n` +
          `6. Environment variable: ${process.env.EXPO_PUBLIC_API_URL ? `EXPO_PUBLIC_API_URL=${process.env.EXPO_PUBLIC_API_URL}` : 'Using default config'}`;
      }

      // Create error with detailed message
      const detailedError = new Error(errorMessage);
      (detailedError as any).response = error.response;
      (detailedError as any).status = error.response?.status;
      throw detailedError;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get("/users/me");
      return response.data;
    } catch (error: any) {
      console.error("Get profile API error:", error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Try to call backend logout endpoint (now supports optional refresh_token)
      // Backend will handle logout even without refresh_token if user is authenticated
      await apiClient.post("/auth/logout", {});
    } catch (error: any) {
      // Log error but don't throw - we still want to clear local token
      // Backend logout is optional - local logout will still work
      if (error?.response?.status !== 401) {
        // Only log if it's not a 401 (unauthorized) - that's expected if token is already invalid
        console.warn("Backend logout failed (this is okay):", error?.response?.status || error?.message);
      }
      // Continue to clear local token even if backend call fails
    } finally {
      // Always clear token from secure storage and axios headers
      await setAuthToken(null);
    }
  },

  // OAuth Sync - Exchange Supabase OAuth token for backend JWT
  oauthSync: async (data: { supabaseUser: any; supabaseToken: string }) => {
    try {
      console.log("[OAuth] Syncing with backend...");
      const response = await apiClient.post("/auth/oauth-sync", {
        supabaseUser: data.supabaseUser,
        supabaseToken: data.supabaseToken,
      });
      console.log("[OAuth] Backend sync successful");
      return response.data;
    } catch (error: any) {
      console.error("[OAuth] Backend sync failed:", error);
      throw error;
    }
  },

  // Change Password
  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const response = await apiClient.post("/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error: any) {
      console.error("Change password API error:", error);
      throw error;
    }
  },

  // Forgot Password
  forgotPassword: async (email: string) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", {
        email,
      });
      return response.data;
    } catch (error: any) {
      console.error("Forgot password API error:", error);
      throw error;
    }
  },

  // Reset Password
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      return response.data;
    } catch (error: any) {
      console.error("Reset password API error:", error);
      throw error;
    }
  },

  // Refresh Token
  refreshToken: async (refreshToken: string) => {
    try {
      const response = await apiClient.post("/auth/refresh-token", {
        refresh_token: refreshToken,
      });
      return response.data;
    } catch (error: any) {
      console.error("Refresh token API error:", error);
      throw error;
    }
  },

  // Update Profile (via Auth endpoint)
  updateProfile: async (data: any) => {
    try {
      const response = await apiClient.put("/auth/update-profile", data);
      return response.data;
    } catch (error: any) {
      console.error("Update profile API error:", error);
      throw error;
    }
  },

  // Get User Sessions
  getSessions: async () => {
    try {
      const response = await apiClient.get("/auth/sessions");
      return response.data;
    } catch (error: any) {
      console.error("Get sessions API error:", error);
      throw error;
    }
  },

  // Delete Session
  deleteSession: async (sessionId: string) => {
    try {
      const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error("Delete session API error:", error);
      throw error;
    }
  },

  // Verify Email
  verifyEmail: async (token: string) => {
    try {
      const response = await apiClient.get(`/auth/verify-email?token=${token}`);
      return response.data;
    } catch (error: any) {
      console.error("Verify email API error:", error);
      throw error;
    }
  },

  // Resend Verification Email
  resendVerification: async (email: string) => {
    try {
      const response = await apiClient.post("/auth/resend-verification", {
        email,
      });
      return response.data;
    } catch (error: any) {
      console.error("Resend verification API error:", error);
      throw error;
    }
  },

  // Verify OTP (for MFA)
  verifyOtp: async (email: string, otp: string) => {
    try {
      const response = await apiClient.post("/auth/verify-otp", {
        email,
        otp,
      });
      return response.data;
    } catch (error: any) {
      console.error("Verify OTP API error:", error);
      throw error;
    }
  },

  // Setup MFA
  setupMFA: async () => {
    try {
      const response = await apiClient.post("/auth/mfa/setup");
      return response.data;
    } catch (error: any) {
      console.error("Setup MFA API error:", error);
      throw error;
    }
  },

  // Verify MFA Setup
  verifyMFASetup: async (code: string) => {
    try {
      const response = await apiClient.post("/auth/mfa/verify-setup", {
        code,
      });
      return response.data;
    } catch (error: any) {
      console.error("Verify MFA setup API error:", error);
      throw error;
    }
  },

  // Disable MFA
  disableMFA: async (code?: string) => {
    try {
      const response = await apiClient.post("/auth/mfa/disable", {
        code,
      });
      return response.data;
    } catch (error: any) {
      console.error("Disable MFA API error:", error);
      throw error;
    }
  },

  // Toggle MFA
  toggleMFA: async () => {
    try {
      const response = await apiClient.post("/auth/toggle-mfa");
      return response.data;
    } catch (error: any) {
      console.error("Toggle MFA API error:", error);
      throw error;
    }
  },
};

/**
 * Admin API Functions
 * 
 * All endpoints use the base URL: /api/v1/admin/*
 * JWT token is automatically attached via axios interceptors
 * All endpoints require ADMIN role (enforced by backend)
 * 
 * Available APIs:
 * - User Management: getAllUsers (GET /admin/users), createUser, updateUser, deleteUser
 * - Project Management: getAllProjects (GET /projects), createProject, updateProject, deleteProject
 * - Bid Management: getAllBids (GET /admin/bids)
 * - Dispute Management: getAllDisputes (GET /admin/disputes), resolveDispute
 * - Finance Management: getFinanceData (GET /admin/finance), approvePayout, getPayouts
 * - Reports & Analytics: getAnalytics, generateReports
 */
export const adminAPI = {
  // User Management
  getAllUsers: async (offset?: number, limit?: number, cursor?: string | null) => {
    try {
      // Backend endpoint: GET /api/v1/admin/all-users
      // Supports cursor-based pagination: ?cursor=user-id&limit=50
      // Also supports offset-based for backward compatibility: ?offset=0&limit=20
      const params: any = {};

      // Use cursor-based pagination if cursor is provided
      if (cursor !== undefined && cursor !== null) {
        params.cursor = cursor;
        if (limit !== undefined) params.limit = limit;
      } else if (offset !== undefined && limit !== undefined) {
        // Fallback to offset-based pagination for backward compatibility
        params.offset = offset;
        params.limit = limit;
      } else if (limit !== undefined) {
        params.limit = limit;
      }

      console.log("[API] GET /admin/all-users with params:", params);
      const response = await apiClient.get("/admin/all-users", { params });
      console.log("[API] GET /admin/all-users response:", response.data);

      // Handle new response format: { success: true, data: { users: [...], nextCursor: ..., hasMore: ..., count: ... } }
      // Backend returns: { success: true, message: "...", data: { users: [...], nextCursor: ..., hasMore: ..., count: ... } }
      if (response.data?.success) {
        const responseData = response.data.data;

        // New format with pagination metadata (nested structure)
        if (responseData && typeof responseData === 'object' && responseData.users && Array.isArray(responseData.users)) {
          console.log(`[API] Retrieved ${responseData.users.length} users (new format with pagination)`);
          console.log(`[API] Next cursor: ${responseData.nextCursor}, Has more: ${responseData.hasMore}`);
          return {
            success: response.data.success,
            message: response.data.message,
            data: responseData.users, // Extract users array
            nextCursor: responseData.nextCursor,
            hasMore: responseData.hasMore,
            count: responseData.count,
          };
        }
        // Old format - data is directly the array
        if (Array.isArray(responseData)) {
          console.log(`[API] Retrieved ${responseData.length} users (old format - direct array)`);
          return {
            success: response.data.success,
            message: response.data.message,
            data: responseData,
          };
        }
      }

      // Fallback: return as-is
      console.warn("[API] Unexpected response format:", response.data);
      return response.data;
    } catch (error: any) {
      // Gracefully handle 404 - endpoint might not exist yet
      if (error.response?.status === 404) {
        // Silently return empty data - don't log as error
        return { data: [], success: false, message: "Endpoint not available" };
      }
      // Only log non-404 errors
      if (error.response?.status !== 404) {
        console.error("[API] Get all users API error:", error);
      }
      // Return empty data instead of throwing
      return { data: [], success: false, message: error.message || "Failed to fetch users" };
    }
  },

  createUser: async (data: {
    fullName: string;
    email: string;
    phone?: string;
    companyName?: string;
    password: string;
    role: string;
  }) => {
    try {
      // Backend endpoint: POST /api/v1/auth/admin/create-user
      // Backend expects: email, password, full_name, role_code
      const requestBody = {
        email: data.email,
        password: data.password,
        full_name: data.fullName, // Convert fullName to full_name
        role_code: data.role, // Convert role to role_code
        // Optional fields (if backend supports them)
        ...(data.phone && { phone: data.phone }),
        ...(data.companyName && { company_name: data.companyName }),
      };

      const response = await apiClient.post("/auth/admin/create-user", requestBody);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Create user endpoint not found (404).");
        throw new Error("User creation endpoint not available");
      }
      // Log the actual error message from backend
      const errorMessage = error.response?.data?.message || error.message || "Failed to create user";
      console.error("Create user API error:", errorMessage);
      throw new Error(errorMessage);
    }
  },

  updateUser: async (userId: string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    role?: string;
  }) => {
    try {
      // Backend endpoint: PUT /api/admin/update-role (for role) or use user update endpoint
      if (data.role) {
        const response = await apiClient.put("/admin/update-role", {
          user_id: userId,
          role_code: data.role,
        });
        return response.data;
      }
      // For other updates, might need to use user profile update endpoint
      throw new Error("User update endpoint not fully implemented");
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Update user endpoint not found (404).");
        throw new Error("User update endpoint not available");
      }
      console.error("Update user API error:", error);
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      console.log(`[API] deleteUser called for userId: ${userId}`);
      // Backend endpoint: DELETE /admin/users/:id
      console.log(`[API] Attempting DELETE /admin/users/${userId}`);
      const response = await apiClient.delete(`/admin/users/${userId}`);
      console.log(`[API] DELETE deleteUser success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Delete user API error:", error);
      console.error("[API] Error response:", error.response?.data);
      // Preserve original error for better debugging
      if (error.response) {
        const detailedError = new Error(error.response?.data?.message || error.message || "Failed to delete user");
        (detailedError as any).response = error.response;
        throw detailedError;
      }
      throw error;
    }
  },

  getUserById: async (userId: string) => {
    try {
      // Backend endpoint: GET /api/admin/users/:id
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: null, success: false, message: "User not found" };
      }
      console.error("Get user by ID API error:", error);
      throw error;
    }
  },

  suspendUser: async (userId: string, reason?: string) => {
    try {
      console.log(`[API] suspendUser called for userId: ${userId}`);
      // Backend endpoint: PUT /admin/users/:id/suspend (not PATCH)
      const requestBody = { reason: reason || "Admin action" };
      console.log(`[API] Attempting PUT /admin/users/${userId}/suspend with body:`, requestBody);
      const response = await apiClient.put(`/admin/users/${userId}/suspend`, requestBody);
      console.log(`[API] PUT suspendUser success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Suspend user API error:", error);
      console.error("[API] Error response:", error.response?.data);
      if (error.response) {
        const detailedError = new Error(error.response?.data?.message || error.message || "Failed to suspend user");
        (detailedError as any).response = error.response;
        throw detailedError;
      }
      throw error;
    }
  },

  unsuspendUser: async (userId: string) => {
    try {
      console.log(`[API] unsuspendUser called for userId: ${userId}`);
      // Backend endpoint: PUT /admin/users/:id/unsuspend (not PATCH)
      console.log(`[API] Attempting PUT /admin/users/${userId}/unsuspend`);
      const response = await apiClient.put(`/admin/users/${userId}/unsuspend`);
      console.log(`[API] PUT unsuspendUser success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Unsuspend user API error:", error);
      console.error("[API] Error response:", error.response?.data);

      // Handle 400 error specifically (user not suspended)
      if (error.response?.status === 400) {
        const backendMessage = error.response?.data?.message || "User is not suspended";
        const detailedError = new Error(backendMessage);
        (detailedError as any).response = error.response;
        (detailedError as any).status = 400;
        throw detailedError;
      }

      // Preserve original error for better debugging
      if (error.response) {
        const detailedError = new Error(error.response?.data?.message || error.message || "Failed to unsuspend user");
        (detailedError as any).response = error.response;
        throw detailedError;
      }
      throw error;
    }
  },

  verifyUser: async (userId: string) => {
    try {
      console.log(`[API] verifyUser called for userId: ${userId}`);
      // Backend endpoint: POST /admin/verify-user with { user_id: userId } in body
      console.log(`[API] Attempting POST /admin/verify-user with user_id: ${userId}`);
      const response = await apiClient.post("/admin/verify-user", {
        user_id: userId,
      });
      console.log(`[API] POST verifyUser success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Verify user API error:", error);
      console.error("[API] Error response:", error.response?.data);
      if (error.response) {
        const detailedError = new Error(error.response?.data?.message || error.message || "Failed to verify user");
        (detailedError as any).response = error.response;
        throw detailedError;
      }
      throw error;
    }
  },

  lockUser: async (userId: string, reason?: string) => {
    try {
      console.log(`[API] lockUser called for userId: ${userId}`);
      // Backend endpoint: PUT /api/v1/admin/users/:id/lock
      const requestBody = { reason: reason || "Admin action" };
      console.log(`[API] Attempting PUT /admin/users/${userId}/lock with body:`, requestBody);
      const response = await apiClient.put(`/admin/users/${userId}/lock`, requestBody);
      console.log(`[API] PUT lockUser success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Lock user API error:", error);
      console.error("[API] Error response:", error.response?.data);
      if (error.response) {
        const detailedError = new Error(error.response?.data?.message || error.message || "Failed to lock user");
        (detailedError as any).response = error.response;
        throw detailedError;
      }
      throw error;
    }
  },

  unlockUser: async (userId: string) => {
    try {
      console.log(`[API] unlockUser called for userId: ${userId}`);
      // Backend endpoint: PUT /api/v1/admin/users/:id/unlock
      console.log(`[API] Attempting PUT /admin/users/${userId}/unlock`);
      const response = await apiClient.put(`/admin/users/${userId}/unlock`);
      console.log(`[API] PUT unlockUser success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Unlock user API error:", error);
      console.error("[API] Error response:", error.response?.data);
      if (error.response) {
        const detailedError = new Error(error.response?.data?.message || error.message || "Failed to unlock user");
        (detailedError as any).response = error.response;
        throw detailedError;
      }
      throw error;
    }
  },

  // Project Management
  getAllProjects: async () => {
    try {
      console.log("[API] GET /projects");
      // Backend endpoint: GET /projects
      const response = await apiClient.get("/projects");
      console.log("[API] GET /projects success:", response.data);
      return response.data;
    } catch (error: any) {
      console.log("[API ERROR]", error);
      // Gracefully handle 404 - return empty data
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      // Return empty data instead of throwing
      return { data: [], success: false, message: error.message || "Failed to fetch projects" };
    }
  },

  createProject: async (data: any) => {
    try {
      // Backend endpoint: POST /api/projects
      const response = await apiClient.post("/projects", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Create project endpoint not found (404).");
        throw new Error("Create project endpoint not available");
      }
      console.error("Create project API error:", error);
      throw error;
    }
  },

  updateProject: async (projectId: string, data: any) => {
    try {
      // Backend endpoint: PUT /api/projects/:id
      const response = await apiClient.put(`/projects/${projectId}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Update project endpoint not found (404).");
        throw new Error("Update project endpoint not available");
      }
      console.error("Update project API error:", error);
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      // Backend endpoint: DELETE /api/projects/:id
      const response = await apiClient.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Delete project endpoint not found (404).");
        throw new Error("Delete project endpoint not available");
      }
      console.error("Delete project API error:", error);
      throw error;
    }
  },

  approveProject: async (projectId: string) => {
    try {
      // Backend endpoint: PUT /projects/:id (update project with approved status)
      // Or use status update endpoint if available
      const response = await apiClient.put(`/projects/${projectId}`, {
        status: "approved",
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Approve project endpoint not found (404).");
        throw new Error("Approve project endpoint not available");
      }
      console.error("Approve project API error:", error);
      throw error;
    }
  },

  updateProjectStatus: async (projectId: string, status: string) => {
    try {
      // Backend endpoint: PUT /projects/:id (update project status)
      const response = await apiClient.put(`/projects/${projectId}`, { status });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Update project status endpoint not found (404).");
        throw new Error("Update project status endpoint not available");
      }
      console.error("Update project status API error:", error);
      throw error;
    }
  },

  // Bid Management
  getAllBids: async () => {
    try {
      // Backend endpoint: GET /api/v1/bids (admin can see all bids via this endpoint)
      // Note: Backend doesn't have /admin/bids, but /bids returns all for admin
      const response = await apiClient.get("/bids");
      return response.data;
    } catch (error: any) {
      // Gracefully handle 404 - return empty data
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      // Only log non-404 errors
      if (error.response?.status !== 404) {
        console.error("Get all bids API error:", error);
      }
      // Return empty data instead of throwing
      return { data: [], success: false, message: error.message || "Failed to fetch bids" };
    }
  },

  // Dispute Management (ADMIN ONLY)
  getAllDisputes: async () => {
    try {
      // Backend endpoint: GET /admin/disputes
      const response = await apiClient.get("/admin/disputes");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("Get all disputes API error:", error);
      return { data: [], success: false, message: error.message || "Failed to fetch disputes" };
    }
  },

  resolveDispute: async (disputeId: string, data: { resolution: string }) => {
    try {
      // Backend endpoint: POST /admin/disputes/{id}/resolve
      const response = await apiClient.post(`/admin/disputes/${disputeId}/resolve`, {
        resolution: data.resolution,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Resolve dispute endpoint not found (404).");
        throw new Error("Resolve dispute endpoint not available");
      }
      console.error("Resolve dispute API error:", error);
      throw error;
    }
  },

  reassignDispute: async (disputeId: string, data: { assignedTo: string }) => {
    try {
      // Backend endpoint: POST /admin/disputes/{id}/reassign
      const response = await apiClient.post(`/admin/disputes/${disputeId}/reassign`, {
        assigned_to: data.assignedTo,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Reassign dispute endpoint not found (404).");
        throw new Error("Reassign dispute endpoint not available");
      }
      console.error("Reassign dispute API error:", error);
      throw error;
    }
  },

  getDisputeById: async (disputeId: string) => {
    try {
      // Backend endpoint: GET /admin/disputes/{id}
      const response = await apiClient.get(`/admin/disputes/${disputeId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: null, success: false, message: "Dispute not found" };
      }
      console.error("Get dispute by ID API error:", error);
      throw error;
    }
  },

  // Finance Management - Aggregate from payments and payouts
  getFinanceData: async () => {
    try {
      // Get finance data by aggregating from /admin/payments and /admin/payouts
      const [paymentsRes, payoutsRes] = await Promise.all([
        adminAPI.getAllPayments().catch(() => ({ data: [] })),
        adminAPI.getAllPayouts().catch(() => ({ data: [] })),
      ]);

      const payments = paymentsRes?.data || paymentsRes || [];
      const payouts = payoutsRes?.data || payoutsRes || [];

      // Calculate finance metrics
      const totalPayments = Array.isArray(payments)
        ? payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        : 0;

      const totalPayouts = Array.isArray(payouts)
        ? payouts.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        : 0;

      const completedPayouts = Array.isArray(payouts)
        ? payouts
          .filter((p: any) => p.status === "completed" || p.status === "approved")
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        : 0;

      const pendingPayouts = Array.isArray(payouts)
        ? payouts
          .filter((p: any) => p.status === "pending")
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        : 0;

      return {
        data: {
          total_earnings: totalPayments,
          total_payments: totalPayments,
          total_payouts: completedPayouts,
          pending_balance: pendingPayouts,
        },
        success: true,
      };
    } catch (error: any) {
      return {
        data: {
          total_earnings: 0,
          total_payments: 0,
          total_payouts: 0,
          pending_balance: 0,
        },
        success: false,
        message: error.message || "Failed to fetch finance data",
      };
    }
  },

  approvePayout: async (payoutId: string) => {
    try {
      console.log("[API] PATCH /admin/payouts/:id/approve", payoutId);
      const response = await apiClient.patch(`/admin/payouts/${payoutId}/approve`);
      console.log("[API] PATCH /admin/payouts/:id/approve success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Approve payout error:", error);
      throw error;
    }
  },

  rejectPayout: async (payoutId: string) => {
    try {
      console.log("[API] PATCH /admin/payouts/:id/reject", payoutId);
      const response = await apiClient.patch(`/admin/payouts/${payoutId}/reject`);
      console.log("[API] PATCH /admin/payouts/:id/reject success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Reject payout error:", error);
      throw error;
    }
  },

  getAllPayments: async () => {
    try {
      // Backend endpoint: GET /payments
      const response = await apiClient.get("/payments");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("Get all payments API error:", error);
      throw error;
    }
  },

  getAllPayouts: async () => {
    try {
      // Backend endpoint: GET /payouts
      const response = await apiClient.get("/payouts");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("Get all payouts API error:", error);
      throw error;
    }
  },

  getPayouts: async () => {
    try {
      // Backend endpoint: GET /api/payouts
      const response = await apiClient.get("/payouts");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Payouts endpoint not found (404). Returning empty array.");
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("Get payouts API error:", error);
      throw error;
    }
  },

  // Reports and Analytics (Not available in backend yet - return mock data)
  getAnalytics: async () => {
    try {
      const response = await apiClient.get("/admin/login-stats");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Analytics endpoint not found (404). Returning mock data.");
        return {
          data: {
            totalUsers: 0,
            totalProjects: 0,
            activeProjects: 0,
            totalRevenue: 0,
          },
          success: false,
          message: "Endpoint not available",
        };
      }
      console.error("Get analytics API error:", error);
      throw error;
    }
  },

  generateReports: async (reportType?: string, params?: any) => {
    try {
      const response = await apiClient.post("/admin/reports/generate", {
        reportType,
        ...params,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Generate reports endpoint not found (404).");
        throw new Error("Generate reports endpoint not available");
      }
      console.error("Generate reports API error:", error);
      throw error;
    }
  },

  // Legacy alias for backward compatibility
  getFinanceReports: async () => {
    return adminAPI.getFinanceData();
  },

  getReports: async () => {
    return adminAPI.getAnalytics();
  },

  // Notification Management (Admin Only)
  getAllNotifications: async () => {
    try {
      // Backend endpoint: GET /notifications
      const response = await apiClient.get("/notifications");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("Get all notifications API error:", error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      console.log("[API] DELETE /notifications/:id", notificationId);
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      console.log("[API] DELETE /notifications/:id success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Delete notification error:", error);
      throw error;
    }
  },

  changeUserRole: async (userId: string, roleCode: string) => {
    try {
      console.log(`[API] PUT /admin/update-role`, { userId, roleCode });
      // Backend endpoint: PUT /admin/update-role
      // Backend expects: { user_id, role_code } (not "role")
      const response = await apiClient.put(`/admin/update-role`, {
        user_id: userId,
        role_code: roleCode, // Backend expects role_code, not role
      });
      console.log(`[API] PUT /admin/update-role success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.log("[API ERROR]", error);
      // Try alternative endpoint if first one fails
      if (error.response?.status === 404) {
        try {
          console.log(`[API] Trying alternative: PUT /admin/users/change-role`);
          const altResponse = await apiClient.put(`/admin/users/change-role`, {
            user_id: userId,
            role_code: roleCode, // Backend expects role_code, not role
          });
          console.log(`[API] PUT /admin/users/change-role success:`, altResponse.data);
          return altResponse.data;
        } catch (altError: any) {
          console.log("[API ERROR] Alternative endpoint also failed:", altError);
          throw new Error(altError?.response?.data?.message || "Role change endpoint not available");
        }
      }
      throw new Error(error?.response?.data?.message || error?.message || "Failed to change user role");
    }
  },

  getLogs: async (offset: number = 0, limit: number = 20, userId?: string) => {
    try {
      console.log("[API] GET /admin/logs", { offset, limit, userId });
      const params: any = { offset, limit };
      if (userId) params.user_id = userId;
      const response = await apiClient.get("/admin/logs", { params });
      console.log("[API] GET /admin/logs success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Get logs error:", error);
      throw error;
    }
  },

  getUserActivityLogs: async (userId: string) => {
    try {
      console.log(`[API] getUserActivityLogs called for userId: ${userId}`);
      // Backend endpoint: GET /api/v1/admin/login-logs?user_id=:userId
      const response = await apiClient.get("/admin/login-logs", {
        params: { user_id: userId, limit: 50 },
      });
      console.log(`[API] getUserActivityLogs success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.warn("[API] Get user activity logs API error:", error);
      // Return empty array if endpoint not available
      return { data: [], success: false };
    }
  },

  impersonateUser: async (userId: string) => {
    try {
      console.log(`[API] impersonateUser called for userId: ${userId}`);
      // Backend endpoint: POST /api/v1/admin/impersonate/:id
      const response = await apiClient.post(`/admin/impersonate/${userId}`);
      console.log(`[API] impersonateUser success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Impersonate user API error:", error);
      if (error.response?.status === 404) {
        throw new Error("Impersonation feature not available on backend");
      }
      throw error;
    }
  },

  stopImpersonation: async () => {
    try {
      console.log(`[API] stopImpersonation called`);
      // Backend endpoint: POST /api/v1/admin/stop-impersonation
      const response = await apiClient.post("/admin/stop-impersonation");
      console.log(`[API] stopImpersonation success:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Stop impersonation API error:", error);
      if (error.response?.status === 404) {
        throw new Error("Stop impersonation endpoint not available");
      }
      throw error;
    }
  },

  // Project Management - Get by ID
  getProjectById: async (projectId: string) => {
    try {
      // Backend endpoint: GET /projects/:id
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: null, success: false, message: "Project not found" };
      }
      console.error("Get project by ID API error:", error);
      throw error;
    }
  },




  // Notifications - Send notification
  sendNotification: async (data: {
    title: string;
    message: string;
    type?: string;
    targetRole?: string;
    userId?: string;
    broadcast?: boolean;
  }) => {
    try {
      // Backend endpoint: POST /notifications
      const response = await apiClient.post("/notifications", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("Send notification endpoint not available");
      }
      console.error("Send notification API error:", error);
      throw error;
    }
  },
};

// Projects API
export const projectsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/projects");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/projects", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (projectId: string, data: any) => {
    try {
      const response = await apiClient.put(`/projects/${projectId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (projectId: string) => {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Bids API
export const bidsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/bids");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (bidId: string) => {
    try {
      const response = await apiClient.get(`/bids/${bidId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/bids", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (bidId: string, data: any) => {
    try {
      const response = await apiClient.put(`/bids/${bidId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  submit: async (bidId: string, data?: any) => {
    try {
      console.log("[API] POST /bids/:bidId/submit", bidId, data);
      const response = await apiClient.post(`/bids/${bidId}/submit`, data || {});
      console.log("[API] POST /bids/:bidId/submit success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Submit bid error:", error);
      throw error;
    }
  },

  getSubmissions: async (bidId: string) => {
    try {
      console.log("[API] GET /bids/:bidId/submissions", bidId);
      const response = await apiClient.get(`/bids/${bidId}/submissions`);
      console.log("[API] GET /bids/:bidId/submissions success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("[API] Get submissions error:", error);
      throw error;
    }
  },

  compare: async (jobId: string) => {
    try {
      console.log("[API] GET /bids/:jobId/compare", jobId);
      const response = await apiClient.get(`/bids/${jobId}/compare`);
      console.log("[API] GET /bids/:jobId/compare success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Compare bids error:", error);
      throw error;
    }
  },

  getMyBids: async () => {
    try {
      const response = await apiClient.get("/bids/my-bids");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getMySubmissions: async () => {
    try {
      const response = await apiClient.get("/bids/submissions/my");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },
};

// Jobs API
export const jobsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/jobs");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  search: async (query: string) => {
    try {
      console.log("[API] GET /jobs/search", { query });
      const response = await apiClient.get("/jobs/search", {
        params: { query },
      });
      console.log("[API] GET /jobs/search success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("[API] Search jobs error:", error);
      throw error;
    }
  },

  getById: async (jobId: string) => {
    try {
      const response = await apiClient.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/jobs", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (jobId: string, data: any) => {
    try {
      const response = await apiClient.put(`/jobs/${jobId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  apply: async (jobId: string, data?: any) => {
    try {
      console.log("[API] POST /jobs/:jobId/apply", jobId, data);
      const response = await apiClient.post(`/jobs/${jobId}/apply`, data || {});
      console.log("[API] POST /jobs/:jobId/apply success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Apply to job error:", error);
      throw error;
    }
  },

  getApplications: async (jobId: string) => {
    try {
      console.log("[API] GET /jobs/:jobId/applications", jobId);
      const response = await apiClient.get(`/jobs/${jobId}/applications`);
      console.log("[API] GET /jobs/:jobId/applications success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("[API] Get applications error:", error);
      throw error;
    }
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    try {
      console.log("[API] PUT /jobs/applications/:applicationId/status", applicationId, status);
      const response = await apiClient.put(`/jobs/applications/${applicationId}/status`, { status });
      console.log("[API] PUT /jobs/applications/:applicationId/status success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Update application status error:", error);
      throw error;
    }
  },
};

// Payments API
export const paymentsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/payments");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (paymentId: string) => {
    try {
      const response = await apiClient.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/payments", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (paymentId: string, data: any) => {
    try {
      const response = await apiClient.put(`/payments/${paymentId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getByProject: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/payments/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },
};

// Payouts API
export const payoutsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/payouts");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (payoutId: string) => {
    try {
      const response = await apiClient.get(`/payouts/${payoutId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/payouts", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateStatus: async (payoutId: string, status: string) => {
    try {
      const response = await apiClient.put(`/payouts/${payoutId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Milestones API
export const milestonesAPI = {
  getByProject: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/milestones/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (milestoneId: string) => {
    try {
      const response = await apiClient.get(`/milestones/${milestoneId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (projectId: string, data: any) => {
    try {
      const response = await apiClient.post(`/milestones/projects/${projectId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (milestoneId: string, data: any) => {
    try {
      const response = await apiClient.put(`/milestones/${milestoneId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  submit: async (milestoneId: string) => {
    try {
      const response = await apiClient.post(`/milestones/${milestoneId}/submit`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  approve: async (milestoneId: string) => {
    try {
      const response = await apiClient.post(`/milestones/${milestoneId}/approve`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Conversations API
export const conversationsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/conversations");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (conversationId: string) => {
    try {
      const response = await apiClient.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/conversations", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Messages API
export const messagesAPI = {
  getByConversation: async (conversationId: string) => {
    try {
      const response = await apiClient.get(`/messages/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  send: async (data: any) => {
    try {
      const response = await apiClient.post("/messages", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      console.log("[API] PUT /messages/conversations/:conversationId/read", conversationId);
      const response = await apiClient.put(`/messages/conversations/${conversationId}/read`);
      console.log("[API] PUT /messages/conversations/:conversationId/read success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Mark conversation as read error:", error);
      throw error;
    }
  },

  markMessageAsRead: async (messageId: string) => {
    try {
      console.log("[API] PATCH /messages/:id/read", messageId);
      const response = await apiClient.patch(`/messages/${messageId}/read`);
      console.log("[API] PATCH /messages/:id/read success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Mark message as read error:", error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiClient.get("/messages/unread/count");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: { count: 0 }, success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    try {
      console.log("[API] GET /notifications");
      const response = await apiClient.get("/notifications");
      console.log("[API] GET /notifications success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      console.log("[API] PUT /notifications/:id/read", notificationId);
      // Backend endpoint: PUT /notifications/:id/read
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      console.log("[API] PUT /notifications/:id/read success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Mark notification as read error:", error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      console.log("[API] PUT /notifications/read-all");
      // Backend endpoint: PUT /notifications/read-all (NOT /read/all)
      const response = await apiClient.put("/notifications/read-all");
      console.log("[API] PUT /notifications/read-all success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Mark all notifications as read error:", error);
      throw error;
    }
  },

  delete: async (notificationId: string) => {
    try {
      console.log("[API] DELETE /notifications/:id", notificationId);
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      console.log("[API] DELETE /notifications/:id success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Delete notification error:", error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      console.log("[API] GET /notifications/unread/count");
      const response = await apiClient.get("/notifications/unread/count");
      // Map 'unread' to 'count' if needed
      if (response.data?.success && response.data?.data) {
        if (response.data.data.unread !== undefined) {
          response.data.data.count = response.data.data.unread;
        }
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: { count: 0 }, success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },


};

// Reviews API
export const reviewsAPI = {
  getByContractor: async (contractorId: string) => {
    try {
      const response = await apiClient.get(`/reviews/contractors/${contractorId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (reviewId: string) => {
    try {
      const response = await apiClient.get(`/reviews/${reviewId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/reviews", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  addResponse: async (reviewId: string, responseText: string) => {
    try {
      const response = await apiClient.post(`/reviews/${reviewId}/response`, { response: responseText });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Disputes API
export const disputesAPI = {
  getAll: async () => {
    try {
      console.log("[API] GET /disputes");
      const response = await apiClient.get("/disputes");
      console.log("[API] GET /disputes success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      console.error("[API] Get all disputes error:", error);
      throw error;
    }
  },

  getByProject: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/disputes/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (disputeId: string) => {
    try {
      console.log("[API] GET /disputes/:id", disputeId);
      const response = await apiClient.get(`/disputes/${disputeId}`);
      console.log("[API] GET /disputes/:id success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Get dispute by id error:", error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/disputes", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateStatus: async (disputeId: string, data: any) => {
    try {
      console.log("[API] PUT /disputes/:id/status", disputeId, data);
      const response = await apiClient.put(`/disputes/${disputeId}/status`, data);
      console.log("[API] PUT /disputes/:id/status success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Update dispute status error:", error);
      throw error;
    }
  },

  assign: async (disputeId: string, data: any) => {
    try {
      console.log("[API] PUT /disputes/:id/assign", disputeId, data);
      const response = await apiClient.put(`/disputes/${disputeId}/assign`, data);
      console.log("[API] PUT /disputes/:id/assign success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Assign dispute error:", error);
      throw error;
    }
  },
};

// Progress Updates API
export const progressUpdatesAPI = {
  getByProject: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/progress-updates/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (updateId: string) => {
    try {
      const response = await apiClient.get(`/progress-updates/${updateId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post("/progress-updates", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async () => {
    try {
      console.log("[API] GET /appointments");
      const response = await apiClient.get("/appointments");
      console.log("[API] GET /appointments success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/appointments/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      console.log("[API] POST /appointments", data);
      const response = await apiClient.post("/appointments", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/appointments/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/appointments/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Contractors API
export const contractorsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/contractors");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  search: async (query: string) => {
    try {
      const response = await apiClient.get("/contractors/search", { params: { q: query } });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { data: [], success: false, message: "Endpoint not available" };
      }
      throw error;
    }
  },

  getById: async (contractorId: string) => {
    try {
      const response = await apiClient.get(`/contractors/${contractorId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (contractorId: string, data: any) => {
    try {
      const response = await apiClient.put(`/contractors/${contractorId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getProfile: async (userId: string) => {
    try {
      const response = await apiClient.get(`/contractors/profiles/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  createProfile: async (data: any) => {
    try {
      const response = await apiClient.post("/contractors/profiles", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  verify: async (userId: string) => {
    try {
      const response = await apiClient.put(`/contractors/profiles/${userId}/verify`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    try {
      console.log("[API] GET /users/me");
      const response = await apiClient.get("/users/me");
      console.log("[API] GET /users/me success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Get profile API error:", error);
      throw error;
    }
  },

  updateProfile: async (data: any) => {
    try {
      console.log("[API] PUT /users/profile", data);

      // Data should already be in backend format (first_name, last_name, etc.)
      // from the calling code
      const response = await apiClient.put("/users/profile", data);
      console.log("[API] PUT /users/profile success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Update profile API error:", error);
      console.error("[API] Error response:", error.response?.data);
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      console.log("[API] POST /auth/change-password");
      const response = await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      console.log("[API] POST /auth/change-password success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[API] Change password API error:", error);
      throw error;
    }
  },
};

// Stats API
export const statsAPI = {
  getUserDashboardStats: async () => {
    try {
      console.log("[API] GET /stats/user-dashboard");
      const response = await apiClient.get("/stats/user-dashboard");
      console.log("[API] GET /stats/user-dashboard success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("[API] Stats endpoint not found (404). Returning empty stats.");
        return {
          data: {
            activeJobs: 0,
            totalJobs: 0,
            totalApplications: 0,
            upcomingAppointments: 0,
            activeProjects: 0,
            totalBids: 0,
            pendingBids: 0,
          },
          success: false,
          message: "Endpoint not available",
        };
      }
      console.error("[API] Get user dashboard stats API error:", error);
      throw error;
    }
  },

  getAdminDashboardStats: async () => {
    try {
      console.log("[API] GET /stats/admin-dashboard");
      const response = await apiClient.get("/stats/admin-dashboard");
      console.log("[API] GET /stats/admin-dashboard success:", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("[API] Admin stats endpoint not found (404). Returning empty stats.");
        return {
          data: {
            totalUsers: 0,
            totalProjects: 0,
            activeProjects: 0,
            totalRevenue: 0,
            pendingDisputes: 0,
            pendingPayouts: 0,
          },
          success: false,
          message: "Endpoint not available",
        };
      }
      console.error("[API] Get admin dashboard stats API error:", error);
      throw error;
    }
  },
};

// Export base URL for debugging
export { BASE_URL };

export default apiClient;

