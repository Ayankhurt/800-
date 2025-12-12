import express from "express";
import { authenticateUser } from "../middlewares/auth.js";
import {
    getTransactions, createTransaction,
    getPayouts, requestPayout,
    getEscrowDetails
} from "../controllers/financeController.js";

const router = express.Router();

// Transactions
router.get("/transactions", authenticateUser, getTransactions);
router.post("/transactions", authenticateUser, createTransaction);

// Payouts
router.get("/payouts", authenticateUser, getPayouts);
router.post("/payouts/request", authenticateUser, requestPayout);

// Escrow
router.get("/escrow/:project_id", authenticateUser, getEscrowDetails);

export default router;
