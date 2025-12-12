import express from "express";
import { authenticateUser } from "../middlewares/auth.js";
import {
    getConversations, createConversation,
    getMessages, sendMessage, markMessagesRead
} from "../controllers/communicationController.js";

const router = express.Router();

// Conversations
router.get("/conversations", authenticateUser, getConversations);
router.post("/conversations", authenticateUser, createConversation);

// Messages
router.get("/conversations/:conversation_id/messages", authenticateUser, getMessages);
router.post("/conversations/:conversation_id/messages", authenticateUser, sendMessage);
router.put("/conversations/:conversation_id/read", authenticateUser, markMessagesRead);

export default router;
