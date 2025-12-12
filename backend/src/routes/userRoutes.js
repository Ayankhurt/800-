// User routes
import express from "express";
import { authenticateUser } from "../middlewares/auth.js"; // Ensure correct import name
import {
    getProfile, updateProfile,
    updateContractorProfile,
    addPortfolioItem, deletePortfolioItem,
    addCertification,
    updateSettings,
    getNotifications, markNotificationRead
} from "../controllers/userController.js";

const router = express.Router();

// Basic Profile
router.get("/me", authenticateUser, getProfile);
router.get("/profile", authenticateUser, getProfile);
router.put("/profile", authenticateUser, updateProfile);

// Contractor Profile
router.put("/contractor-profile", authenticateUser, updateContractorProfile);

// Portfolio
router.post("/portfolio", authenticateUser, addPortfolioItem);
router.delete("/portfolio/:id", authenticateUser, deletePortfolioItem);

// Certifications
router.post("/certifications", authenticateUser, addCertification);

// Settings
router.put("/settings", authenticateUser, updateSettings);

// Notifications
router.get("/notifications", authenticateUser, getNotifications);
router.put("/notifications/:id/read", authenticateUser, markNotificationRead);

export default router;