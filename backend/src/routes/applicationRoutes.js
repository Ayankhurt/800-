import express from "express";
import {
    applyToJob,
    getJobApplications,
    getMyApplications,
    updateApplicationStatus,
    withdrawApplication
} from "../controllers/applicationController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requirePermission } from "../middlewares/rbac.js";

const router = express.Router();

router.post("/", authenticateUser, applyToJob);
router.get("/job/:job_id", authenticateUser, getJobApplications);
router.get("/my-applications", authenticateUser, getMyApplications);
router.put("/:id/status", authenticateUser, updateApplicationStatus);
router.put("/:id/withdraw", authenticateUser, withdrawApplication);

export default router;
