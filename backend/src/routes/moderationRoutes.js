import express from 'express';
import {
    getModerationQueue,
    approveReport,
    rejectReport,
    getVerificationQueue,
    approveVerification,
    rejectVerification,
    createAdminUser,
    updateAdminUser
} from '../controllers/moderationController.js';
import { authenticateUser, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// Moderation Queue
router.get('/queue', getModerationQueue);
router.put('/:reportId/approve', approveReport);
router.put('/:reportId/reject', rejectReport);

// Verification Management
router.get('/verification/queue', getVerificationQueue); // Keeping verification sub-path if desired, or simplified
router.put('/verification/:verificationId/approve', approveVerification);
router.put('/verification/:verificationId/reject', rejectVerification);

// Admin User Management
router.post('/users', createAdminUser);
router.put('/users/:userId', updateAdminUser);

export default router;
