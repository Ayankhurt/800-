import express from "express";
import { sendMessage, getConversations, getMessages } from "../controllers/messageController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, sendMessage);
router.get("/conversations", authenticateUser, getConversations);
router.get("/:conversation_id", authenticateUser, getMessages);

export default router;
