import express from "express";
import {
    getUserNotifications,
    getAllNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getUnreadCount,
    sendBulkNotifications
} from "../controllers/notificationController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// User routes
router.get("/", authenticateUser, getUserNotifications);
router.get("/unread/count", authenticateUser, getUnreadCount);
router.put("/read-all", authenticateUser, markAllNotificationsAsRead);
router.put("/:id/read", authenticateUser, markNotificationAsRead);
router.delete("/:id", authenticateUser, deleteNotification);

// Admin routes
router.get("/all", authenticateUser, requireAdmin, getAllNotifications);
router.post("/bulk", authenticateUser, requireAdmin, sendBulkNotifications);

export default router;
