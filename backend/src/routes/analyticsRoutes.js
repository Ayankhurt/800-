import express from "express";
import {
    trackProfileView,
    getProfileAnalytics,
    getPerformanceMetrics
} from "../controllers/analyticsController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/view", authenticateUser, trackProfileView);
router.get("/profile", authenticateUser, getProfileAnalytics);
router.get("/performance", authenticateUser, getPerformanceMetrics);

export default router;
