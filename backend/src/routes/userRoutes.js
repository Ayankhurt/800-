// User routes
import express from "express";
import { auth } from "../middlewares/auth.js"; // Fixed: use 'auth' instead of 'authenticateUser'
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
router.get("/me", auth, getProfile);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

// Contractor Profile
router.put("/contractor-profile", auth, updateContractorProfile);

// Portfolio
router.post("/portfolio", auth, addPortfolioItem);
router.delete("/portfolio/:id", auth, deletePortfolioItem);

// Certifications
router.post("/certifications", auth, addCertification);

// Settings
router.put("/settings", auth, updateSettings);

// Notifications
router.get("/notifications", auth, getNotifications);
router.put("/notifications/:id/read", auth, markNotificationRead);

export default router;