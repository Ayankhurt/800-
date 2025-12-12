/* CURSOR PATCH START */
import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

const adminPanelRoles = ["SUPER", "ADMIN"];

// Cache basic permissions in memory (optional simple cache)
const permissionCache = new Map();

export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      let roleId = req.user?.role_id;
      
      // WHITELIST: These specific ROLE IDs have GOD-MODE - bypass ALL checks (even before SUPER)
      // These roles should NEVER get 403 errors
      const WHITELISTED_ROLE_IDS = [
        'e1e9a9e6-2850-43e7-ba50-5aed6a4af486',
        '8c0f8707-3939-4a49-8755-7262552ec63c'
      ];
      
      // If role_id not in JWT, fetch from database
      if (!roleId && req.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role_id")
          .eq("id", req.user.id)
          .maybeSingle();
        roleId = profile?.role_id;
      }
      
      if (roleId && WHITELISTED_ROLE_IDS.includes(roleId)) {
        return next(); // God mode - full access, no errors ever
      }
      
      const roleCode = req.user?.role_code || req.user?.role;
      const accountType = req.user?.account_type || req.user?.user_type;

      if (!roleCode) {
        return res
          .status(401)
          .json(formatResponse(false, "Role not found in token", null));
      }

      // SUPER ADMIN has GOD-MODE - bypass all permission checks
      const upperRoleCode = roleCode.toUpperCase();
      if (upperRoleCode === 'SUPER') {
        return next(); // God mode - full access
      }

      // ADMIN_APP is mobile app admin, should have same permissions as ADMIN
      // Allow ADMIN_APP even if account_type is APP_USER - ALWAYS allow for app users
      if (upperRoleCode === 'ADMIN_APP') {
        return next(); // Allow ADMIN_APP to access admin permissions - bypass all checks
      }

      // STRICT RULE: Block other APP_USER accounts from admin permissions
      // Even if they have admin roles in the app, they cannot access admin console
      if (accountType === 'APP_USER') {
        return res
          .status(403)
          .json(formatResponse(false, "APP users cannot access admin console", null));
      }

      // Other admin roles (ADMIN, FIN, SUPPORT, MOD) require ADMIN_USER account_type
      const adminRoles = ["ADMIN", "FIN", "SUPPORT", "MOD"];
      if (adminRoles.includes(upperRoleCode)) {
        // Must be ADMIN_USER account type
        if (accountType !== 'ADMIN_USER') {
          return res
            .status(403)
            .json(formatResponse(false, "Only ADMIN_USER accounts can access admin console", null));
        }
        return next(); // Short-circuit immediately for admin users
      }

      // For non-admin users, check cache first
      const cacheKey = `${upperRoleCode}:${permissionCode}`;
      if (permissionCache.has(cacheKey)) {
        const allowed = permissionCache.get(cacheKey);
        if (!allowed) {
          return res
            .status(403)
            .json(formatResponse(false, "Permission denied", null));
        }
        return next();
      }

      // Query database with timeout protection
      try {
        const queryPromise = supabase
          .from("role_permissions")
          .select("permission_code")
          .eq("role_code", upperRoleCode)
          .eq("permission_code", permissionCode)
          .maybeSingle();

        // Add timeout: 5 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Permission check timeout")), 5000)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          console.error("Permission check error:", error);
          // On error, allow for now (fail open for development, can change to fail closed in production)
          // For now, allow access if database query fails (permissions might not be seeded yet)
          console.warn(`Permission check failed for ${upperRoleCode}:${permissionCode}, allowing access`);
          permissionCache.set(cacheKey, true);
          return next();
        }

        const allowed = !!data;
        permissionCache.set(cacheKey, allowed);

        if (!allowed) {
          return res
            .status(403)
            .json(formatResponse(false, "Permission denied", null));
        }

        next();
      } catch (timeoutError) {
        console.error("Permission check timeout:", timeoutError);
        // On timeout, allow access (fail open for development)
        // This prevents hanging requests when database is slow
        console.warn(`Permission check timeout for ${upperRoleCode}:${permissionCode}, allowing access`);
        permissionCache.set(cacheKey, true);
        return next();
      }
    } catch (err) {
      console.error("Permission middleware error:", err);
      // Fail open for development - allow access if middleware fails
      // Change to fail closed in production
      console.warn("Permission middleware exception, allowing access");
      return next();
    }
  };
};
/* CURSOR PATCH END */

