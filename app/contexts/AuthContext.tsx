import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authAPI, setAuthToken, getStoredToken } from "@/services/api";
import { DEV_MACHINE_IP } from "@/config/api";
import { router } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import { Platform, useColorScheme, Linking } from "react-native";
import { lightPalette, darkPalette } from "@/constants/colors";

// App roles + ADMIN (for login only, not signup)
export type AppRole = "PM" | "GC" | "SUB" | "TS" | "VIEWER" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  name?: string; // Added for compatibility with components using .name
  email: string;
  role: AppRole;
  company?: string;
  phone?: string;
  avatar?: string | null;
  two_factor_enabled?: boolean;
  is_active?: boolean;
  verification_status?: string;
  settings?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isNavigationReady: boolean;
  hydrationComplete: boolean;
  isDarkMode: boolean;
  colors: typeof lightPalette;
  setNavigationReady: (ready: boolean) => void;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ success: boolean; error?: string; requiresMFA?: boolean }>;
  signup: (data: {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    password: string;
    role: AppRole;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  navigateByRole: (role: AppRole) => void;
  safeNavigate: (path: string) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: string, userData: any) => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook((): AuthContextType => {
  const systemColorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNavigationReady, setNavigationReady] = useState(false);
  const [hydrationComplete, setHydrationComplete] = useState(false);

  // Theme logic
  const [cachedTheme, setCachedTheme] = useState<'light' | 'dark' | null>(null);

  // Load cached theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const theme = await AsyncStorage.getItem('app_theme');
        if (theme === 'light' || theme === 'dark') {
          setCachedTheme(theme);
        }
      } catch (e) {
        console.warn('Failed to load cached theme', e);
      }
    };
    loadTheme();
  }, []);

  const isDarkMode = useMemo(() => {
    // 1. Check user settings (highest priority)
    if (user?.settings?.dark_mode !== undefined) {
      const isDark = !!user.settings.dark_mode;
      // Persist to simple storage for next restart
      AsyncStorage.setItem('app_theme', isDark ? 'dark' : 'light').catch(() => { });
      return isDark;
    }

    // 2. Check cached theme from last session
    if (cachedTheme) {
      return cachedTheme === 'dark';
    }

    // 3. Fallback to system theme
    return systemColorScheme === 'dark';
  }, [user?.settings?.dark_mode, cachedTheme, systemColorScheme]);

  const colors = useMemo(() => {
    return isDarkMode ? darkPalette : lightPalette;
  }, [isDarkMode]);

  // Safe navigation function - only navigates if navigator is ready AND Stack is rendered
  // Uses retry mechanism to handle cases where navigator isn't ready yet
  const safeNavigate = useCallback((path: string) => {
    // Don't navigate if Stack hasn't rendered yet (hydration not complete)
    // This prevents navigation errors during initial app load
    if (!hydrationComplete) {
      console.log("Navigation deferred: Stack not rendered yet (hydration incomplete)");
      // Retry after hydration completes
      setTimeout(() => {
        if (hydrationComplete) {
          safeNavigate(path);
        }
      }, 200);
      return;
    }

    const attemptNavigation = () => {
      try {
        // Use push for login to ensure it works even if navigator is initializing
        if (path === "/login" || path === "login") {
          // Ensure path starts with /
          const normalizedPath = path.startsWith("/") ? path : `/${path}`;
          router.push(normalizedPath as any);
        } else {
          // For other paths, try replace first
          const normalizedPath = path.startsWith("/") ? path : `/${path}`;
          router.replace(normalizedPath as any);
        }
      } catch (error: any) {
        console.warn("Navigation attempt failed:", error?.message || error);
        // If navigation fails, try push as fallback
        try {
          const normalizedPath = path.startsWith("/") ? path : `/${path}`;
          router.push(normalizedPath as any);
        } catch (pushError: any) {
          console.warn("Navigation fallback failed:", pushError?.message || pushError);
          // If both fail, retry after a delay
          setTimeout(() => {
            try {
              const normalizedPath = path.startsWith("/") ? path : `/${path}`;
              router.push(normalizedPath as any);
            } catch (retryError) {
              console.error("Navigation retry failed:", retryError);
            }
          }, 300);
        }
      }
    };

    if (isNavigationReady && hydrationComplete) {
      // Navigator is ready - navigate immediately
      attemptNavigation();
    } else {
      // Navigator not ready - wait a bit and retry
      setTimeout(() => {
        if (isNavigationReady && hydrationComplete) {
          attemptNavigation();
        }
      }, 200);
    }
  }, [isNavigationReady, hydrationComplete, router]);

  // Navigate to main app - ALL roles use the same UI
  // Admin only gets extra buttons, not a separate dashboard
  // ONLY call this after hydrationComplete === true
  // force: bypass hydration check (used by login/signup after setting hydrationComplete)
  const navigateByRole = useCallback((role: AppRole, force: boolean = false) => {
    // Only navigate if hydration is complete (unless forced)
    if (!force && !hydrationComplete) {
      console.warn("Navigation blocked: hydration not complete");
      return;
    }
    // ALL roles (PM, GC, SUB, TS, VIEWER, ADMIN) use the same tabs UI
    // No conditional navigation - Admin sees same UI with more buttons
    safeNavigate("/(tabs)");
  }, [safeNavigate, hydrationComplete]);

  // Internal logout helper - clears state without navigation
  // Used by restoreSession to avoid circular dependencies
  const clearAuthState = useCallback(async () => {
    await setAuthToken(null);
    try {
      await AsyncStorage.removeItem('auth_user');
    } catch (e) {
      console.warn('Failed to clear user cache', e);
    }
    setTokenState(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Listen for Supabase auth state changes (for OAuth)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Supabase Auth]', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session) {
        // OAuth login successful - session created by Supabase
        console.log('[OAuth] Session detected, syncing with backend...');

        const supabaseUser = session.user;

        try {
          // Call backend to sync OAuth user and get backend JWT
          const response = await authAPI.oauthSync({
            supabaseUser,
            supabaseToken: session.access_token,
          });

          if (response.success && response.data) {
            const { token: backendToken, user: backendUser } = response.data;

            // Map backend role to app role
            let roleCode = backendUser.role || backendUser.role_code || backendUser.roleCode;
            if (roleCode && typeof roleCode === 'object') {
              roleCode = roleCode.role_code || roleCode.roleCode || roleCode.code;
            }
            const appRole = mapBackendRoleToAppRole(roleCode) || 'PM';

            const mappedUser: User = {
              id: backendUser.id,
              email: backendUser.email || '',
              fullName: backendUser.first_name + ' ' + backendUser.last_name,
              role: appRole,
              company: backendUser.company_name,
              phone: backendUser.phone,
              avatar: backendUser.avatar_url,
              settings: backendUser.settings, // Preserve settings
            };
            setUser(mappedUser);

            // Use backend JWT token
            await setAuthToken(backendToken);
            setTokenState(backendToken);
            setIsAuthenticated(true);
            setHydrationComplete(true);

            // Save to cache
            try {
              await AsyncStorage.setItem('auth_user', JSON.stringify(mappedUser));
            } catch (e) { console.warn('Cache save failed', e); }

            console.log('[OAuth] Backend sync successful, using backend JWT');

            // Navigate to dashboard
            setTimeout(() => {
              navigateByRole(appRole, true);
            }, 500);
          }
        } catch (error) {
          console.error('[OAuth] Backend sync failed:', error);
          // Fallback to basic Supabase user data
          const mappedUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            role: 'PM',
            company: supabaseUser.user_metadata?.company,
            phone: supabaseUser.user_metadata?.phone,
            avatar: supabaseUser.user_metadata?.avatar_url,
          };
          setUser(mappedUser);

          // CRITICAL FIX: Store the Supabase token so API calls work
          await setAuthToken(session.access_token);
          setTokenState(session.access_token);
          setIsAuthenticated(true);
          setHydrationComplete(true);

          // Save to cache
          try {
            await AsyncStorage.setItem('auth_user', JSON.stringify(mappedUser));
          } catch (e) { console.warn('Cache save failed', e); }

          setTimeout(() => {
            navigateByRole('PM', true);
          }, 500);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigateByRole]);

  // Restore session from SecureStore + AsyncStorage
  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);
      const storedToken = await getStoredToken();
      let cachedUser: User | null = null;

      try {
        const cachedUserJson = await AsyncStorage.getItem('auth_user');
        if (cachedUserJson) {
          cachedUser = JSON.parse(cachedUserJson);
        }
      } catch (e) {
        console.warn('Failed to load cached user', e);
      }

      if (storedToken) {
        await setAuthToken(storedToken);
        setTokenState(storedToken);

        // Optimistic restore
        if (cachedUser) {
          console.log("Restoring session from cache optimistically");
          setUser(cachedUser);
          setIsAuthenticated(true);
          setHydrationComplete(true);
          // We are "logged in" now, but we verify with backend below
        }

        // Fetch user profile - ALWAYS get fresh role from backend
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.data) {
            const userData = response.data;
            // Map backend role to app role - check multiple possible field names
            // Backend might return role as object {name, role_code} or as string
            let roleCode = userData.role || userData.role_code || userData.roleCode || userData.role_name;

            // If role is an object, extract role_code
            if (roleCode && typeof roleCode === 'object') {
              roleCode = roleCode.role_code || roleCode.roleCode || roleCode.code;
            }

            const appRole = mapBackendRoleToAppRole(roleCode);

            // Only allow app roles + ADMIN (for login)
            if (appRole && ["PM", "GC", "SUB", "TS", "VIEWER", "ADMIN"].includes(appRole)) {
              const mappedUser: User = {
                id: userData.id || userData.user_id,
                fullName: userData.fullName || userData.full_name || userData.name,
                email: userData.email,
                role: appRole,
                company: userData.company || userData.companyName || userData.company_name,
                phone: userData.phone || userData.phoneNumber || userData.phone_number,
                avatar: userData.avatar || userData.avatar_url,
                settings: userData.settings, // Preserve settings
              };

              setUser(mappedUser);
              setIsAuthenticated(true);

              // Update cache
              try {
                await AsyncStorage.setItem('auth_user', JSON.stringify(mappedUser));
              } catch (e) {
                console.warn('Failed to update user cache', e);
              }

              // Mark hydration as complete after token + user/role are loaded
              setHydrationComplete(true);

              // DO NOT navigate here - let _layout.tsx handle navigation
              // Navigation happens after loading completes and user/role are confirmed
            } else {
              // Invalid role - clear session (without navigation)
              await clearAuthState();
            }
          } else {
            // If we had a cached user, maybe keep it? verify response success logic.
            // If backend explicitly says success=false, likely invalid token or error.
            if (cachedUser) {
              // Keep cached user if response was weird but not 401
              console.warn("Backend response invalid, keeping cached user");
              setUser(cachedUser); // Ensure user is set from cache
              setIsAuthenticated(true);
              setHydrationComplete(true);
            } else {
              await clearAuthState();
            }
          }
        } catch (error: any) {
          console.error("Failed to fetch profile during restore:", error);

          if (error?.response?.status === 401 || error?.response?.status === 403) {
            console.warn("Token confirmed invalid by backend (401/403), logging out.");
            await clearAuthState();
          } else {
            console.warn("Backend unreachable or error (500), keeping session if cached.");
            // If we have cachedUser, we stay logged in.
            // If not, we can't do anything, effectively logged out.
            if (cachedUser) {
              setUser(cachedUser); // Ensure user is set from cache
              setIsAuthenticated(true);
              setHydrationComplete(true);
            } else {
              // No cache, no backend => waiting or logged out?
              // Let's set hydrationComplete=true so at least we stop spinning
              setHydrationComplete(true);
            }
          }
        }
      } else {
        setIsAuthenticated(false);
        setHydrationComplete(true);
      }
    } catch (error) {
      console.error("Failed to restore session (outer):", error);
      setIsAuthenticated(false);
      setHydrationComplete(true);
    } finally {
      setLoading(false);
    }
  }, [clearAuthState]);

  // Map backend role codes to app roles
  const mapBackendRoleToAppRole = (roleCode: string | null | undefined | any): AppRole | null => {
    // Handle if roleCode is an object (backend returns full role object)
    if (roleCode && typeof roleCode === 'object') {
      // Extract role_code from object
      roleCode = roleCode.role_code || roleCode.roleCode || roleCode.code;
      console.log("Extracted role_code from object:", roleCode);
    }

    // Check if roleCode exists and is a string
    if (!roleCode || typeof roleCode !== 'string') {
      console.warn("Invalid roleCode:", roleCode);
      return null;
    }

    const upperRoleCode = roleCode.toUpperCase();

    // Map backend codes to app roles + ADMIN
    const roleMap: Record<string, AppRole> = {
      // Uppercase codes (legacy/frontend)
      PM: "PM",
      GC: "GC",
      SUB: "SUB",
      TS: "TS",
      VIEWER: "VIEWER",
      ADMIN: "ADMIN",
      SUPER: "ADMIN",
      ADMIN_APP: "ADMIN",

      // Full names with spaces
      "PROJECT MANAGER": "PM",
      "GENERAL CONTRACTOR": "GC",
      "SUBCONTRACTOR": "SUB",
      "TRADE SPECIALIST": "TS",
      "ADMIN CONSOLE": "ADMIN",

      // Database enum values with underscores (backend returns these)
      "PROJECT_MANAGER": "PM",
      "GENERAL_CONTRACTOR": "GC",
      "TRADE_SPECIALIST": "TS",

      // Admin role variants (all map to ADMIN)
      "SUPER_ADMIN": "ADMIN",
      "FINANCE_MANAGER": "ADMIN",
      "MODERATOR": "ADMIN",
      "SUPPORT_AGENT": "ADMIN",

      // Legacy roles
      "CLIENT": "PM",
      "CONTRACTOR": "GC",
    };

    return roleMap[upperRoleCode] || null;
  };

  // Login
  const login = useCallback(async (email: string, password: string, mfaCode?: string) => {
    try {
      const response = await authAPI.login(email, password, mfaCode);

      if (!response.success) {
        // Check for MFA requirement
        if (response.data && response.data.requires_mfa) {
          return { success: false, requiresMFA: true, error: "Please enter your 2FA code" };
        }
        return { success: false, error: response.message || "Login failed" };
      }

      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;

        if (!newToken || !userData) {
          return { success: false, error: "Invalid response from server" };
        }

        // Map backend role to app role - check multiple possible field names
        // Backend might return role as object {name, role_code} or as string
        let roleCode = userData.role || userData.role_code || userData.roleCode || userData.role_name;

        // If role is an object, extract role_code
        if (roleCode && typeof roleCode === 'object') {
          roleCode = roleCode.role_code || roleCode.roleCode || roleCode.code;
        }

        console.log("Login response user data:", {
          role: userData.role,
          role_code: userData.role_code,
          extractedRoleCode: roleCode,
          allUserData: userData
        });
        const appRole = mapBackendRoleToAppRole(roleCode);

        // Allow app roles + ADMIN (for login only)
        if (!appRole || !["PM", "GC", "SUB", "TS", "VIEWER", "ADMIN"].includes(appRole)) {
          return {
            success: false,
            error: `Invalid user role: ${roleCode || 'undefined'}. Only app roles and ADMIN are allowed.`
          };
        }

        // Save token
        await setAuthToken(newToken);
        setTokenState(newToken);

        // Map user data
        const mappedUser: User = {
          id: userData.id || userData.user_id,
          fullName: userData.fullName || userData.full_name || userData.name,
          email: userData.email,
          role: appRole,
          company: userData.company || userData.companyName || userData.company_name,
          phone: userData.phone || userData.phoneNumber || userData.phone_number,
          avatar: userData.avatar || userData.avatar_url,
          settings: userData.settings,
        };

        setUser(mappedUser);
        setIsAuthenticated(true);

        // Save to cache
        try {
          await AsyncStorage.setItem('auth_user', JSON.stringify(mappedUser));
        } catch (e) { console.warn('Cache save failed', e); }

        // Mark hydration as complete after successful login
        setHydrationComplete(true);

        // Navigate ONLY after hydration is complete
        // Use navigateByRole with force=true since we just set hydrationComplete
        // (state update is async, so we bypass the check)
        navigateByRole(appRole, true);

        return { success: true };
      } else {
        return { success: false, error: response.message || "Login failed" };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Login failed. Please try again.",
      };
    }
  }, [navigateByRole]);

  // Signup
  const signup = useCallback(async (data: {
    fullName: string;
    email?: string;
    password: string;
    role: AppRole;
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
      // Validate role - ADMIN cannot signup, only login
      if (data.role === "ADMIN") {
        return { success: false, error: "Admin users cannot sign up. Please use login instead." };
      }

      // Only allow app roles for signup (no ADMIN)
      if (!["PM", "GC", "SUB", "TS", "VIEWER"].includes(data.role)) {
        return { success: false, error: "Invalid role. Only app roles are allowed for signup." };
      }

      const response = await authAPI.signup({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        companyName: data.companyName,
        tradeSpecialization: data.tradeSpecialization,
        yearsExperience: data.yearsExperience,
        licenseNumber: data.licenseNumber,
        licenseType: data.licenseType,
        insuranceDetails: data.insuranceDetails,
        location: data.location,
        portfolio: data.portfolio,
        certifications: data.certifications,
        projectType: data.projectType,
      });

      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;

        if (!newToken || !userData) {
          return { success: false, error: "Invalid response from server" };
        }

        // Map backend role to app role - check multiple possible field names
        // Backend might return role as object {name, role_code} or as string
        let roleCode = userData.role || userData.role_code || userData.roleCode || userData.role_name;

        // If role is an object, extract role_code
        if (roleCode && typeof roleCode === 'object') {
          roleCode = roleCode.role_code || roleCode.roleCode || roleCode.code;
        }

        console.log("Signup response user data:", {
          role: userData.role,
          role_code: userData.role_code,
          extractedRoleCode: roleCode,
          allUserData: userData
        });
        const appRole = mapBackendRoleToAppRole(roleCode);

        // Block ADMIN from signup
        if (appRole === "ADMIN") {
          return {
            success: false,
            error: "Admin users cannot sign up. Please use login instead."
          };
        }

        // Only allow app roles for signup (no ADMIN)
        if (!appRole || !["PM", "GC", "SUB", "TS", "VIEWER"].includes(appRole)) {
          return {
            success: false,
            error: `Invalid user role: ${roleCode || 'undefined'}. Only app roles are allowed for signup.`
          };
        }

        // Save token
        await setAuthToken(newToken);
        setTokenState(newToken);

        // Map user data
        const mappedUser: User = {
          id: userData.id || userData.user_id,
          fullName: userData.fullName || userData.full_name || userData.name,
          email: userData.email,
          role: appRole,
          company: userData.company || userData.companyName || userData.company_name,
          phone: userData.phone || userData.phoneNumber || userData.phone_number,
          avatar: userData.avatar || userData.avatar_url,
          settings: userData.settings,
        };

        setUser(mappedUser);
        setIsAuthenticated(true);

        // Save to cache
        try {
          await AsyncStorage.setItem('auth_user', JSON.stringify(mappedUser));
        } catch (e) { console.warn('Cache save failed', e); }

        // Mark hydration as complete after successful signup
        setHydrationComplete(true);

        // Navigate ONLY after hydration is complete
        // Use navigateByRole with force=true since we just set hydrationComplete
        // (state update is async, so we bypass the check)
        navigateByRole(appRole, true);

        return { success: true };
      } else {
        return { success: false, error: response.message || "Signup failed" };
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Signup failed. Please try again.",
      };
    }
  }, [navigateByRole]);

  // Logout - clears state and navigates to login
  const logout = useCallback(async () => {
    // Always clear local state, even if backend call fails
    try {
      // Try to call backend logout (optional - don't block on failure)
      await authAPI.logout();
    } catch (error: any) {
      // Backend logout failed - that's okay, we'll still clear local state
      console.warn("Backend logout failed (continuing with local logout):",
        error?.response?.status || error?.message);
    } finally {
      // Always clear local authentication state
      await clearAuthState();

      // Only reset hydration if it was complete (user was logged in)
      // If hydration wasn't complete, we're still in initial load, so don't reset
      if (hydrationComplete) {
        setHydrationComplete(false);
      }

      // Safe navigation to login - only if Stack is rendered (hydrationComplete was true)
      // If Stack isn't rendered yet, the normal flow will handle showing login screen
      if (hydrationComplete) {
        // Use setTimeout to ensure state updates are processed
        // Use router.replace with proper path format for Expo Router
        setTimeout(() => {
          try {
            // Expo Router uses path-based navigation
            // Use push instead of replace to avoid navigation state issues
            const loginPath = "/login";
            console.log(`[logout] Navigating to login: ${loginPath}`);
            // Try push first (more reliable for Expo Router)
            router.push(loginPath);
          } catch (error: any) {
            console.warn("Navigation to login failed, retrying:", error?.message);
            // Retry after a short delay with different approach
            setTimeout(() => {
              try {
                // Try using replace as fallback
                console.log(`[logout] Retry navigation to login with replace`);
                router.replace("/login");
              } catch (retryError) {
                console.error("Navigation retry failed:", retryError);
                // Last resort: try to reset and navigate
                try {
                  console.log(`[logout] Final attempt: dismissAll then push`);
                  router.dismissAll();
                  setTimeout(() => {
                    router.push("/login");
                  }, 100);
                } catch (finalError) {
                  console.error("Final navigation attempt failed:", finalError);
                  // If all navigation fails, the index screen will handle redirect
                  console.log(`[logout] Navigation failed, index screen will handle redirect`);
                }
              }
            }, 200);
          }
        }, 150);
      } else {
        // If hydration wasn't complete, just let the normal flow continue
        // The index screen will handle redirect when hydration completes
        console.log(`[logout] Hydration not complete, index screen will handle redirect`);
      }
    }
  }, [safeNavigate, clearAuthState, hydrationComplete]);

  // Social login with OAuth (Google & GitHub)
  const loginWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    try {
      console.log(`[OAuth] Starting ${provider} login...`);

      // Redirect to app root - Supabase stores session automatically
      const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/`
        : `exp://${DEV_MACHINE_IP}:8081/`;

      console.log(`[OAuth] Redirect URL: ${redirectTo}`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web', // Only redirect on web
        },
      });

      if (error) {
        console.error(`[OAuth] ${provider} login error:`, error);
        return { success: false, error: error.message };
      }

      console.log(`[OAuth] ${provider} login initiated successfully`);

      // On mobile, we need to explicitly open the URL returned by Supabase
      if (Platform.OS !== 'web' && data?.url) {
        console.log(`[OAuth] Opening browser for ${provider}: ${data.url}`);
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          console.error(`[OAuth] Cannot open URL: ${data.url}`);
          return { success: false, error: "Cannot open browser for login" };
        }
      }

      return { success: true };

    } catch (error: any) {
      console.error(`[OAuth] ${provider} login exception:`, error);
      return { success: false, error: error.message || `${provider} login failed` };
    }
  }, []);

  // Update user in local state (for profile updates)
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updates };
      setUser(newUser);
      // Persist to local storage as well for better state retention
      try {
        await AsyncStorage.setItem("user", JSON.stringify(newUser));
      } catch (e) {
        console.warn("Failed to save user to cache:", e);
      }
    }
  }, [user]);

  const socialLogin = useCallback(async (provider: string, userData: any) => {
    // For demo/mock purposes, we just set the user
    const newUser: User = {
      id: userData.id || `social-${Date.now()}`,
      email: userData.email,
      fullName: userData.name || userData.fullName || "Social User",
      role: "VIEWER", // Default role
      avatar: userData.avatar,
      is_active: true,
      verification_status: "verified",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUser(newUser);
    setIsAuthenticated(true);
    await setAuthToken(`mock-token-${Date.now()}`);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
  }, []);

  return useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      isNavigationReady,
      hydrationComplete,
      isDarkMode,
      colors,
      setNavigationReady,
      login,
      signup,
      logout,
      restoreSession,
      navigateByRole,
      safeNavigate,
      updateUser,
      loginWithOAuth,
      socialLogin,
    }),
    [
      user,
      token,
      loading,
      isAuthenticated,
      isNavigationReady,
      hydrationComplete,
      isDarkMode,
      colors,
      setNavigationReady,
      login,
      signup,
      logout,
      restoreSession,
      navigateByRole,
      safeNavigate,
      updateUser,
      loginWithOAuth,
      socialLogin,
    ]
  );
});
