import apiClient from './axios';

// Types
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
    user?: {
      id: string;
      email: string;
      full_name: string;
      role_code: string;
      user_type: string;
      role?: any;
    };
    mfa_required?: boolean;
    temp_token?: string;
    email?: string;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    access_token: string;
    refresh_token: string;
    expires_at: string;
    user: {
      id: string;
      email: string;
      full_name: string;
      role_code: string;
      user_type: string;
    };
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role_code: string;
  user_type?: string;
  account_type?: string;
  status?: string;
  role?: any;
  mfa_enabled?: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  device?: string;
  login_time: string;
  expires_at: string;
  created_at: string;
}

// Public Routes
export const authService = {
  // Signup
  signup: async (email: string, password: string, full_name: string, role_code?: string) => {
    const response = await apiClient.post<SignupResponse>('/auth/signup', {
      email,
      password,
      full_name,
      role_code: role_code || 'VIEWER',
    });
    return response.data;
  },

  // Login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      // Try regular login first
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      // If regular login fails with 400/401, try admin login
      if (error.response?.status === 400 || error.response?.status === 401) {
        try {
          const adminResponse = await apiClient.post<LoginResponse>('/auth/admin/login', {
            email,
            password,
          });
          return adminResponse.data;
        } catch (adminError) {
          // If admin login also fails, throw the original error
          throw error;
        }
      }
      // For other errors, throw immediately
      throw error;
    }
  },

  // Verify OTP (MFA)
  verifyOtp: async (temp_token: string, otp: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/verify-otp', {
      temp_token,
      otp,
    });
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset Password
  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  },

  // Resend Verification
  resendVerification: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Authenticated Routes
  // Get Current User
  getMe: async (): Promise<{ success: boolean; data: UserProfile }> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Update Profile
  updateProfile: async (data: { full_name?: string; phone?: string; avatar_url?: string }) => {
    const response = await apiClient.put('/auth/update-profile', data);
    return response.data;
  },

  // Change Password
  changePassword: async (old_password: string, new_password: string) => {
    const response = await apiClient.post('/auth/change-password', {
      old_password,
      new_password,
    });
    return response.data;
  },

  // Get Sessions
  getSessions: async (): Promise<{ success: boolean; data: Session[] }> => {
    const response = await apiClient.get('/auth/sessions');
    return response.data;
  },

  // Delete Session
  deleteSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  // Toggle MFA
  toggleMfa: async (enable: boolean) => {
    const response = await apiClient.post('/auth/toggle-mfa', { enable });
    return response.data;
  },

  // Logout
  logout: async (refresh_token: string) => {
    const response = await apiClient.post('/auth/logout', { refresh_token });
    return response.data;
  },
};

