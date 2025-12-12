import { formatResponse } from "../utils/formatResponse.js";

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(formatResponse(false, "Authentication required"));
      }

      const userRole = (req.user.role || '').toUpperCase();
      const allowed = allowedRoles.map(r => r.toUpperCase());

      // SUPER / ADMIN overrides
      if (userRole === 'SUPER_ADMIN' || userRole === 'SUPER') return next();
      if (userRole === 'ADMIN' && allowed.includes('ADMIN')) return next();
      if (userRole === 'ADMIN' && allowed.includes('ADMIN_APP')) return next();

      if (allowed.includes(userRole)) {
        return next();
      }

      return res.status(403).json(formatResponse(false, "Access denied. Insufficient privileges."));
    } catch (err) {
      return res.status(500).json(formatResponse(false, err.message));
    }
  };
};