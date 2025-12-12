'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/src/lib/api/authService';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Auto-fetch profile on app load
export function useProfile() {
  const router = useRouter();

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await authService.getMe();
        if (response.success) {
          return response.data;
        }
        throw new Error('Failed to fetch profile');
      } catch (error: any) {
        // If 401, clear invalid session
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
          }
        }
        throw error;
      }
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
    retry: false, // Don't retry on failure
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

// Login mutation
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message);
        return;
      }

      const { token, refresh_token, user, mfa_required, temp_token } = response.data;

      if (mfa_required) {
        // Handle MFA - return temp_token for OTP verification
        return { mfa_required: true, temp_token };
      }

      if (token && user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Invalidate and refetch profile
        queryClient.invalidateQueries({ queryKey: ['profile'] });

        // Check if user has admin access (web admin panel only)
        // ADMIN_APP is for mobile app, not web admin panel
        const adminRoles = ['SUPER', 'ADMIN', 'FIN', 'MOD', 'SUPPORT'];
        if (adminRoles.includes(user.role_code)) {
          // Show role-specific welcome message
          if (user.role_code === 'SUPER') {
            toast.success('Welcome, Super Admin!');
          } else if (user.role_code === 'ADMIN') {
            toast.success('Welcome, Admin!');
          } else {
            toast.success('Login successful');
          }
          router.push('/dashboard');
        } else if (user.role_code === 'ADMIN_APP') {
          toast.error('Platform Admin is for mobile app only. Please use the mobile app.');
          // Redirect to 403 page instead of clearing storage
          router.push('/403');
        } else {
          toast.error('You do not have admin access');
          if (typeof window !== 'undefined') {
            localStorage.clear();
          }
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Login failed');
    },
  });
}

// Logout mutation
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken =
        typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          // Ignore logout errors
        }
      }
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      queryClient.clear();
      router.push('/');
    },
  });
}

