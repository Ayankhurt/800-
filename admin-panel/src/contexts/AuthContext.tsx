'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/src/lib/api/authService';
import apiClient from '@/src/lib/api/axios';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/src/hooks/useAuthQuery';

// Types
export interface User {
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

// Define admin roles for web admin panel
const ADMIN_ROLES = ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'];

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ mfa_required?: boolean; temp_token?: string }>;
  verifyOtp: (temp_token: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAdmin: boolean;
  isSuper: boolean;
  isWebAdmin: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Auto-fetch profile using React Query
  const { data: profileData, isLoading: profileLoading, error: profileError } = useProfile();

  // Update localStorage when profileData changes
  useEffect(() => {
    if (profileData && typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(profileData));
    }
  }, [profileData]);

  // Load user from localStorage on mount and sync with React Query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refresh_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);

        // Use React Query profile data if available, otherwise use localStorage
        if (profileData) {
          // Fresh data from API - normalize role_code
          const u = { ...profileData } as any;
          if (!u.role_code && u.role) {
            const r = String(u.role).toLowerCase();
            if (r === 'super_admin') u.role_code = 'SUPER';
            else if (r === 'admin') u.role_code = 'ADMIN';
            else if (r === 'finance_manager') u.role_code = 'FIN';
            else if (r === 'moderator') u.role_code = 'MOD';
            else if (r === 'support_agent') u.role_code = 'SUPPORT';
            else u.role_code = String(u.role).toUpperCase();
          }
          setUser(u);
          setLoading(false);
        } else if (storedUser && !profileError) {
          // Use localStorage data temporarily while API loads
          try {
            const parsedUser = JSON.parse(storedUser);
            // Normalize role_code
            if (!parsedUser.role_code && parsedUser.role) {
              const r = String(parsedUser.role).toLowerCase();
              if (r === 'super_admin') parsedUser.role_code = 'SUPER';
              else if (r === 'admin') parsedUser.role_code = 'ADMIN';
              else if (r === 'finance_manager') parsedUser.role_code = 'FIN';
              else if (r === 'moderator') parsedUser.role_code = 'MOD';
              else if (r === 'support_agent') parsedUser.role_code = 'SUPPORT';
              else parsedUser.role_code = String(parsedUser.role).toUpperCase();
            }
            setUser(parsedUser);
            setLoading(profileLoading); // Keep loading state synced with profile fetch
          } catch {
            clearAuth();
            setLoading(false);
          }
        } else if (profileError) {
          // Only clear auth if it's a 401 (unauthorized) error
          // Other errors (like 404, 500) might be temporary - keep user logged in
          const errorStatus = (profileError as any)?.response?.status;
          if (errorStatus === 401) {
            clearAuth();
          } else if (storedUser) {
            // Use cached user data for other errors
            try {
              const parsedUser = JSON.parse(storedUser);
              if (!parsedUser.role_code && parsedUser.role) {
                const r = String(parsedUser.role).toLowerCase();
                if (r === 'super_admin') parsedUser.role_code = 'SUPER';
                else if (r === 'admin') parsedUser.role_code = 'ADMIN';
                else if (r === 'finance_manager') parsedUser.role_code = 'FIN';
                else if (r === 'moderator') parsedUser.role_code = 'MOD';
                else if (r === 'support_agent') parsedUser.role_code = 'SUPPORT';
                else parsedUser.role_code = String(parsedUser.role).toUpperCase();
              }
              setUser(parsedUser);
            } catch {
              // If can't parse, clear auth
              clearAuth();
            }
          }
          setLoading(false);
        } else if (!profileLoading) {
          // No profile data and not loading - stop loading
          setLoading(false);
        }
      } else {
        // No token - not loading
        setLoading(false);
      }
    }
  }, [profileData, profileLoading, profileError]);

  const clearAuth = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        // Check if MFA is required
        if (response.data.mfa_required) {
          return {
            mfa_required: true,
            temp_token: response.data.temp_token,
          };
        }

        // Normal login - store tokens and user
        if (response.data.token && response.data.user) {
          const newToken = response.data.token;
          const newRefreshToken = response.data.refresh_token || null;
          let userData = response.data.user as any;

          // Normalize role to role_code for frontend
          if (!userData.role_code && userData.role) {
            const r = String(userData.role).toLowerCase();
            if (r === 'super_admin') userData.role_code = 'SUPER';
            else if (r === 'admin') userData.role_code = 'ADMIN';
            else if (r === 'finance_manager') userData.role_code = 'FIN';
            else if (r === 'moderator') userData.role_code = 'MOD';
            else if (r === 'support_agent') userData.role_code = 'SUPPORT';
            else userData.role_code = String(userData.role).toUpperCase();
          }

          setToken(newToken);
          setRefreshToken(newRefreshToken);
          setUser(userData);

          if (typeof window !== 'undefined') {
            localStorage.setItem('token', newToken);
            if (newRefreshToken) {
              localStorage.setItem('refresh_token', newRefreshToken);
            }
            localStorage.setItem('user', JSON.stringify(userData));
          }

          return { mfa_required: false };
        }
      }

      throw new Error(response.message || 'Login failed');
    } catch (error: any) {
      throw error;
    }
  };

  const verifyOtp = async (temp_token: string, otp: string) => {
    try {
      const response = await authService.verifyOtp(temp_token, otp);

      if (response.success && response.data.token && response.data.user) {
        const newToken = response.data.token;
        const newRefreshToken = response.data.refresh_token || null;
        const userData = response.data.user;

        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setUser(userData);

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshTokenToDelete = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
      if (refreshTokenToDelete) {
        // Call logout API which deletes session by refresh_token
        await apiClient.post('/auth/logout', { // Fixed: removed /api prefix
          refresh_token: refreshTokenToDelete,
        }).catch(() => {
          // Ignore errors on logout
        });
      }
    } catch (error) {
      // Ignore errors
    } finally {
      clearAuth();
      router.push('/');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  };

  // Compute admin status based on role_code (not user_type/account_type)
  // SUPER always bypasses checks, but we still compute isAdmin for other roles
  const userRoleCode = (user?.role_code || '').toUpperCase();
  const isSuper = userRoleCode === 'SUPER';
  const isWebAdmin = ADMIN_ROLES.includes(userRoleCode);

  // For normal admins: must have ADMIN_USER account_type AND be in ADMIN_ROLES (except SUPER)
  // SUPER ignores account_type check
  const isAdmin = isSuper || (
    isWebAdmin &&
    (user?.account_type === 'ADMIN_USER' || user?.user_type === 'ADMIN_USER')
  );

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role_code);
  };

  const value: AuthContextType = {
    user,
    token,
    refreshToken,
    loading,
    login,
    verifyOtp,
    logout,
    updateUser,
    isAdmin,
    isSuper,
    isWebAdmin,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

