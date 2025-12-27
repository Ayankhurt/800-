import express from 'express';
import { authenticateUser } from '../middlewares/auth.js';
import {
    createMilestone,
    getMilestones,
    getMilestoneById,
    updateMilestone,
    deleteMilestone,
    completeMilestone,
} from '../controllers/milestoneController.js';

const router = express.Router();

// All milestone routes require authentication
router.use(authenticateUser);

// Milestone CRUD operations
router.post('/', createMilestone);
router.get('/', getMilestones);
router.get('/:id', getMilestoneById);
router.put('/:id', updateMilestone);
router.delete('/:id', deleteMilestone);

// Milestone actions
router.post('/:id/complete', completeMilestone);

export default router;
