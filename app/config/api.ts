import { Platform } from "react-native";

/**
 * API Configuration
 * 
 * Priority order:
 * 1. EXPO_PUBLIC_API_URL (environment variable) - Highest priority
 * 2. EXPO_PUBLIC_API_IP + EXPO_PUBLIC_API_PORT (environment variables)
 * 3. Default hardcoded values (fallback)
 * 
 * To configure, create a .env file in root:
 * EXPO_PUBLIC_API_URL=http://192.168.2.10:5000/api/v1
 * OR
 * EXPO_PUBLIC_API_IP=192.168.2.10
 * EXPO_PUBLIC_API_PORT=5000
 */

// Get base URL with environment variable priority
const baseURL = getBaseURL();

export const API_CONFIG = {
  BASE_URL: baseURL,
  TIMEOUT: 30000,
};

// Debug logging in development
if (__DEV__) {
  console.log("🔧 API Configuration:");
  console.log("  EXPO_PUBLIC_API_URL:", process.env.EXPO_PUBLIC_API_URL || "not set");
  console.log("  EXPO_PUBLIC_API_IP:", process.env.EXPO_PUBLIC_API_IP || "not set");
  console.log("  EXPO_PUBLIC_API_PORT:", process.env.EXPO_PUBLIC_API_PORT || "not set");
  console.log("  Final BASE_URL:", baseURL);
}

function getBaseURL(): string {
  // WEB PLATFORM - Always use localhost
  if (Platform.OS === "web") {
    console.log("🌐 Web platform detected - using localhost");
    return "http://localhost:5000/api/v1";
  }

  // MOBILE PLATFORMS - Use env variables or default IP
  // Priority 1: Full URL from environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    let url = process.env.EXPO_PUBLIC_API_URL.trim();

    // Check if URL is missing port (for http://)
    // Pattern: http://IP/path (missing port) vs http://IP:PORT/path (has port)
    if (url.startsWith('http://')) {
      // Extract the part after http://
      const afterProtocol = url.substring(7); // Remove 'http://'
      const firstSlash = afterProtocol.indexOf('/');
      const hostPart = firstSlash > 0 ? afterProtocol.substring(0, firstSlash) : afterProtocol;
      const pathPart = firstSlash > 0 ? afterProtocol.substring(firstSlash) : '';

      // Check if host part has a port (contains ':')
      if (!hostPart.includes(':')) {
        // Missing port, add default port 5000
        url = `http://${hostPart}:5000${pathPart}`;
      }
    }

    // Ensure URL ends with /api/v1 if not already present
    if (!url.includes('/api/v1')) {
      // Remove trailing slash if present
      url = url.replace(/\/$/, '');
      // Add /api/v1 if not present
      if (!url.endsWith('/api/v1')) {
        url = `${url}/api/v1`;
      }
    }
    return url;
  }

  // Priority 2: IP and Port from environment variables
  const API_IP = process.env.EXPO_PUBLIC_API_IP || "192.168.2.10";
  const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

  // Check if we're in development
  if (__DEV__) {
    // All platforms use the same IP address from env or default
    return `http://${API_IP}:${API_PORT}/api/v1`;
  }

  // Production URL (update this when deploying)
  return "https://api.bidroom.com/api/v1";
}

// Helper to get your local IP for physical device testing
export const getLocalIPInstructions = () => {
  const currentURL = API_CONFIG.BASE_URL;
  return `API Server: ${currentURL}\n` +
    `Make sure backend is running and accessible at this address.\n` +
    `Config Source: ${process.env.EXPO_PUBLIC_API_URL ? "EXPO_PUBLIC_API_URL" :
      process.env.EXPO_PUBLIC_API_IP ? "EXPO_PUBLIC_API_IP + EXPO_PUBLIC_API_PORT" :
        "Default hardcoded values"
    }`;
};

