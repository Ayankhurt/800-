// Stats Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role.js';
import {
  getUserDashboardStats,
  getAdminDashboardStats,
} from '../controllers/statsController.js';

const router = express.Router();

// User Dashboard Stats
router.get('/user-dashboard', auth, getUserDashboardStats);

// Admin Dashboard Stats - Allow ADMIN_APP as well
router.get('/admin-dashboard', auth, requireRole(['SUPER', 'ADMIN', 'ADMIN_APP']), getAdminDashboardStats);

export default router;

