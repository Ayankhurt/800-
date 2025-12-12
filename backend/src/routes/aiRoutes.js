import express from 'express';
import {
    generateContract,
    getContract,
    updateContract,
    finalizeContract,
    analyzeProgress,
    generateTimeline
} from '../controllers/aiController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Contract generation
router.post('/generate-contract', generateContract);
router.get('/contracts/:id', getContract);
router.put('/contracts/:id', updateContract);
router.post('/contracts/:id/finalize', finalizeContract);

// Progress monitoring
router.post('/milestones/:milestoneId/analyze-progress', analyzeProgress);

// Timeline generation
router.post('/projects/:projectId/generate-timeline', generateTimeline);

export default router;

