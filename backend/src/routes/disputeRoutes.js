import express from "express";
import {
    fileDispute,
    getDisputes,
    getDisputeById,
    addDisputeResponse,
    resolveDispute,
    closeDispute
} from "../controllers/disputeController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requirePermission } from "../middlewares/rbac.js";

const router = express.Router();

router.post("/", authenticateUser, fileDispute);
router.get("/", authenticateUser, getDisputes);
router.get("/:id", authenticateUser, getDisputeById);
router.post("/:dispute_id/responses", authenticateUser, addDisputeResponse);
router.put("/:id/resolve", authenticateUser, requirePermission('disputes.resolve'), resolveDispute);
router.put("/:id/close", authenticateUser, closeDispute);

export default router;
