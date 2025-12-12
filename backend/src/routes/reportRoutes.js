import express from "express";
import {
    reportContent,
    getReports,
    updateReportStatus
} from "../controllers/reportController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

router.post("/", authenticateUser, reportContent);
router.get("/", authenticateUser, requireAdmin, getReports);
router.put("/:id/status", authenticateUser, requireAdmin, updateReportStatus);

export default router;
