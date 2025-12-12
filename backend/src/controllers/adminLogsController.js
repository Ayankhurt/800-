// Admin Logs Controller
import { adminService } from '../services/adminService.js';
import { formatResponse } from '../utils/formatResponse.js';

export const getAdminLogs = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await adminService.getAdminLogs(limit, offset);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

