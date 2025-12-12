import express from "express";
import {
    createQuote,
    getQuotes,
    updateQuoteStatus
} from "../controllers/quoteController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, createQuote);
router.get("/", authenticateUser, getQuotes);
router.put("/:id/status", authenticateUser, updateQuoteStatus);

export default router;
