import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { formatResponse } from "../utils/formatResponse.js";
import { supabase } from "../config/supabaseClient.js";
import logger from "../utils/logger.js";

dotenv.config();

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(formatResponse(false, "Unauthorized - Missing or invalid token"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json(formatResponse(false, "Unauthorized - Token not found"));
    }

    let userId;
    let decoded;

    // Try custom JWT first
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (jwtError) {
      // If custom JWT fails, try Supabase token
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return res.status(401).json(formatResponse(false, "Invalid or expired token"));
        }
        userId = user.id;
      } catch (supabaseError) {
        return res.status(401).json(formatResponse(false, "Invalid or expired token"));
      }
    }

    if (!userId) {
      return res.status(401).json(formatResponse(false, "Invalid token - Missing user identifier"));
    }

    // Verify user exists in 'users' table first
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      logger.error("Auth Middleware DB Error (Users):", error);
      return res.status(500).json(formatResponse(false, "Internal Server Error during authentication"));
    }

    // If not found in users table, check admin_users table
    if (!user) {
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", userId)
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        logger.error("Auth Middleware DB Error (Admins):", adminError);
        return res.status(500).json(formatResponse(false, "Internal Server Error during authentication"));
      }

      if (!adminUser) {
        return res.status(401).json(formatResponse(false, "User profile not found"));
      }

      // Use admin user data
      user = adminUser;
    }

    if (!user.is_active) {
      return res.status(403).json(formatResponse(false, "Account is inactive"));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    logger.error("Auth Middleware Error:", err);
    return res.status(500).json(formatResponse(false, "Authentication error"));
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'ADMIN')) {
    return res.status(403).json(formatResponse(false, "Access denied - Admin privileges required"));
  }
  next();
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(formatResponse(false, "Unauthorized - User not found"));
    }

    const userRole = (req.user.role || '').toUpperCase();
    const authorizedRoles = roles.map(r => r.toUpperCase());

    if (!authorizedRoles.includes(userRole)) {
      return res.status(403).json(
        formatResponse(false, `Access denied - Authorization required`)
      );
    }

    next();
  };
};

// Export alias for backward compatibility if needed
export const auth = authenticateUser;