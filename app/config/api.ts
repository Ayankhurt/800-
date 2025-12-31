import { Platform } from "react-native";

/**
 * API Configuration
 * 
 * Priority order:
 * 1. EXPO_PUBLIC_API_URL (environment variable) - Highest priority
 * 2. EXPO_PUBLIC_API_IP + EXPO_PUBLIC_API_PORT (environment variables)
 * 3. Default hardcoded values (fallback)
 * 
 * EXPO_PUBLIC_API_IP=192.168.2.10
 * EXPO_PUBLIC_API_PORT=5000
 */

// CENTRAL DEVELOPMENT IP - Change this once to update everywhere
export const DEV_MACHINE_IP = '192.168.0.106';
export const DEV_PORT = '5000';

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
  // 1. Priority 1: Full URL from environment variable (Highest Priority - works on all platforms)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL.trim();
    if (__DEV__) console.log(`📡 [API Config] Using EXPO_PUBLIC_API_URL: ${url}`);
    return url;
  }

  // 2. WEB PLATFORM - Dynamic detection for development
  if (Platform.OS === "web") {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // If we are accessing via a tunnel or local IP
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // If it's a local network IP we are accessing from, try to use that
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
          return `http://${hostname}:${DEV_PORT}/api/v1`;
        }
        // Fallback for tunnels: assuming backend is at the current hostname
        return `http://${hostname}:${DEV_PORT}/api/v1`;
      }
    }
    // Default for local web development
    return "http://localhost:5000/api/v1";
  }

  // 3. MOBILE PLATFORMS - Fallback logic
  let url = "https://800-phi.vercel.app/api/v1"; // Production Default
  let source = "Production Fallback";

  // Check for IP components if specifically provided
  if (process.env.EXPO_PUBLIC_API_IP) {
    const ip = process.env.EXPO_PUBLIC_API_IP.trim();
    const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || DEV_PORT;
    url = `http://${ip}:${port}/api/v1`;
    source = "EXPO_PUBLIC_API_IP";
  }

  // MOBILE OVERRIDE: If URL is localhost but we are on Mobile, replace with target IP
  if ((Platform.OS as string) !== 'web' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    url = url.replace('localhost', DEV_MACHINE_IP).replace('127.0.0.1', DEV_MACHINE_IP);
    source += " + Mobile IP Override";
  }

  if (__DEV__) {
    console.log(`📡 [API Config] Final URL: ${url} (Source: ${source}, Platform: ${Platform.OS})`);
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

