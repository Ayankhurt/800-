import express from "express";
import {
    getSettings,
    updateSettings,
    getNotificationPreferences,
    updateNotificationPreferences,
    getPrivacySettings,
    updatePrivacySettings
} from "../controllers/settingsController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticateUser, getSettings);
router.put("/", authenticateUser, updateSettings);
router.get("/notifications", authenticateUser, getNotificationPreferences);
router.put("/notifications", authenticateUser, updateNotificationPreferences);
router.get("/privacy", authenticateUser, getPrivacySettings);
router.put("/privacy", authenticateUser, updatePrivacySettings);

export default router;
