import express from "express";
import {
    submitVerificationRequest,
    getVerificationRequests,
    getVerificationRequestById,
    approveVerification,
    rejectVerification,
    getMyVerificationStatus
} from "../controllers/verificationController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requirePermission } from "../middlewares/rbac.js";

const router = express.Router();

// User routes
router.post("/request", authenticateUser, submitVerificationRequest);
router.get("/my-status", authenticateUser, getMyVerificationStatus);

// Admin routes
router.get("/", authenticateUser, getVerificationRequests);
router.get("/:id", authenticateUser, getVerificationRequestById);
router.put("/:id/approve", authenticateUser, approveVerification);
router.put("/:id/reject", authenticateUser, rejectVerification);

export default router;
