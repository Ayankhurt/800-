import { formatResponse } from "../utils/formatResponse.js";

export const requireSuperAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json(formatResponse(false, "Authentication required", null));
        }

        if (req.user.role !== 'super_admin') {
            return res.status(403).json(formatResponse(false, "Super Admin access required", null));
        }

        next();
    } catch (err) {
        return res.status(500).json(formatResponse(false, "Internal server error", null));
    }
};
