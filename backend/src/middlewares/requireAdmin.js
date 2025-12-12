import { formatResponse } from "../utils/formatResponse.js";

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatResponse(false, "Authentication required", null));
    }

    const allowedRoles = ['admin', 'super_admin', 'moderator', 'support', 'support_agent', 'finance', 'finance_manager'];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(formatResponse(false, "Admin access required", null));
    }

    next();
  } catch (err) {
    return res.status(500).json(formatResponse(false, "Internal server error", null));
  }
};
