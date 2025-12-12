import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_CONFIG } from "@/config/api";

// Check if we're on web platform
const isWeb = Platform.OS === "web";

const BASE_URL = API_CONFIG.BASE_URL;

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}[] = [];

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log base URL in development
if (__DEV__) {
  console.log("🌐 API Base URL:", BASE_URL);
  console.log("📱 Platform:", Platform.OS);
}

// Token storage helpers
export const setAccessToken = async (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (isWeb) {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } catch (error) {
        console.error("Error saving access token:", error);
      }
    } else {
      try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
      } catch (error) {
        console.error("Error saving access token:", error);
      }
    }
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
    if (isWeb) {
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      } catch (error) {
        console.error("Error removing access token:", error);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      } catch (error) {
        console.error("Error removing access token:", error);
      }
    }
  }
};

export const setRefreshToken = async (token: string | null) => {
  if (token) {
    if (isWeb) {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } catch (error) {
        console.error("Error saving refresh token:", error);
      }
    } else {
      try {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      } catch (error) {
        console.error("Error saving refresh token:", error);
      }
    }
  } else {
    if (isWeb) {
      try {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch (error) {
        console.error("Error removing refresh token:", error);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      } catch (error) {
        console.error("Error removing refresh token:", error);
      }
    }
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    return null;
  }
};

// Clear all tokens (logout)
export const clearTokens = async () => {
  await setAccessToken(null);
  await setRefreshToken(null);
};

// Refresh token function
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: newRefreshToken } = response.data?.data || {};
    
    if (access_token) {
      await setAccessToken(access_token);
      if (newRefreshToken) {
        await setRefreshToken(newRefreshToken);
      }
      return access_token;
    }
    
    throw new Error("No access token in refresh response");
  } catch (error) {
    // Refresh failed - clear tokens and logout
    await clearTokens();
    throw error;
  }
};

// Process queued requests after token refresh
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

// Request interceptor - attach access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle network errors
    if (error.code === "ECONNABORTED" || error.message === "Network Error") {
      const baseUrlForTest = BASE_URL.replace('/api/v1', '').replace('/api', '');
      const networkError = new Error(
        `Cannot connect to server at ${BASE_URL}\n\n` +
        `Please check:\n` +
        `1. Backend server is running: cd backend && npm start\n` +
        `2. Backend is accessible at ${baseUrlForTest}\n` +
        `3. Test in browser: ${baseUrlForTest}/api/health\n` +
        `4. Firewall allows connections on port 5000\n` +
        `5. Both devices are on the same network`
      );
      return Promise.reject(networkError);
    }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        
        if (originalRequest.headers && newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Refresh failed - trigger logout
        // Import logout function dynamically to avoid circular dependency
        if (typeof window !== 'undefined' && (window as any).logoutUser) {
          (window as any).logoutUser();
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { BASE_URL };




