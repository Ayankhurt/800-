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
  // WEB PLATFORM - Dynamic detection
  if (Platform.OS === "web") {
    // Check if we are in a browser environment
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // If we are accessing via a tunnel (ngrok, expo, etc) or local IP
      // we still want to hit the backend at 192.168.1.113 OR the current hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // If it looks like a tunnel URL, it's safer to use the hardcoded LAN IP 
        // because the backend is likely NOT tunneled on the same URL
        if (hostname.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
          return "http://192.168.1.113:5000/api/v1";
        }
        return `http://${hostname}:5000/api/v1`;
      }
    }
    // Default for local web development
    return "http://localhost:5000/api/v1";
  }

  // MOBILE PLATFORMS - Use env variables or default IP
  let url = "";
  let source = "";

  // Priority 1: Full URL from environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    url = process.env.EXPO_PUBLIC_API_URL.trim();
    source = "EXPO_PUBLIC_API_URL";

    // Check if URL is missing port (for http://)
    if (url.startsWith('http://') && !url.includes(':', 7)) {
      // Extract host part and add 5000
      const parts = url.replace('http://', '').split('/');
      const host = parts[0];
      const path = parts.slice(1).join('/');
      url = `http://${host}:5000/${path}`;
    }
  } else {
    // Priority 2: IP and Port from environment variables
    const API_IP = process.env.EXPO_PUBLIC_API_IP || "192.168.1.113";
    const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";
    url = `http://${API_IP}:${API_PORT}/api/v1`;
    source = process.env.EXPO_PUBLIC_API_IP ? "EXPO_PUBLIC_API_IP" : "Default Fallback";
  }

  // Final cleanup: Ensure /api/v1
  if (!url.includes('/api/v1')) {
    url = url.replace(/\/$/, '') + '/api/v1';
  }

  // MOBILE OVERRIDE: If URL is localhost but we are on Mobile, replace with target IP
  // This helps when Expo caches old environment variables
  if ((Platform.OS as string) !== 'web' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    const oldUrl = url;
    url = url.replace('localhost', '192.168.1.113').replace('127.0.0.1', '192.168.1.113');
    if (__DEV__) {
      console.log(`⚠️  [API Config] Mobile detected - Overriding ${oldUrl} with ${url}`);
    }
  }

  if (__DEV__) {
    console.log(`📡 [API Config] Using URL: ${url} (from ${source})`);
  }

  return url;
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

