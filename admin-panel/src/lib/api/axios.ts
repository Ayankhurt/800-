import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const getAdminApiUrl = () => {
  // Priority 1: Environment Variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // Priority 2: In Browser environment, detect if we are on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Priority 3: Support local network debugging
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `http://${hostname}:5000`;
    }
  }

  // Priority 4: Fallback to Production Vercel
  return 'https://800-phi.vercel.app';
};

const API_URL = getAdminApiUrl();

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Force fresh data for /auth/me endpoint - prevent 304 cache
      if (config.url?.includes('/auth/me')) {
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response, // Return full response, not response.data
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept auth routes (login/signup) to prevent redirect loops or unwanted reloads
      // when user simply enters wrong credentials
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/signup')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Get refresh token
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (!refreshToken) {
        // No refresh token, logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Try to refresh token
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        const { data } = response.data;
        const newToken = data.access_token;
        const newRefreshToken = data.refresh_token;

        // Store new tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
        }

        // Update original request header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        processQueue(null, newToken);
        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - check if user is SUPER or ADMIN before redirecting
    if (error.response?.status === 403) {
      // Don't redirect SUPER or ADMIN users - they should never get 403
      // This might be a backend issue, so just log it
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const roleCode = (user?.role_code || '').toUpperCase();
            // SUPER and ADMIN should never get 403 - might be backend issue
            if (roleCode === 'SUPER' || roleCode === 'ADMIN') {
              console.warn('SUPER/ADMIN user got 403 error - this should not happen');
              // Don't redirect, let the request fail gracefully
              return Promise.reject(error);
            }
          } catch (e) {
            // If can't parse user, proceed with redirect
          }
        }
        // For other users, redirect to dashboard
        window.location.href = '/dashboard';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

