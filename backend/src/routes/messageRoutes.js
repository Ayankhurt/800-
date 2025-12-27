import express from "express";
import {
    sendMessage,
    getConversations,
    getMessages,
    createConversation,
    markAsRead,
    deleteMessage,
    getUnreadCount
} from "../controllers/messageController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

// Specific routes first (to avoid conflicts with generic /:conversation_id)
router.get("/unread/count", authenticateUser, getUnreadCount);
router.post("/conversations", authenticateUser, createConversation);
router.get("/conversations", authenticateUser, getConversations);
router.get("/conversations/:conversation_id/messages", authenticateUser, getMessages);
router.put("/conversations/:conversation_id/read", authenticateUser, markAsRead);

// Specific message actions
router.patch("/:message_id/read", authenticateUser, markAsRead);
router.delete("/:message_id", authenticateUser, deleteMessage);

// Generic message send
router.post("/", authenticateUser, sendMessage);

export default router;
