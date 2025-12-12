import express from "express";
import {
    getAiContracts,
    getAiAnalysis,
    getEmailCampaigns,
    createEmailCampaign,
    getBlockedIps,
    blockIp,
    unblockIp,
    getDdosLogs,
    getFailedLogins
} from "../controllers/extendedAdminController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Apply admin middleware
router.use(authenticateUser);
router.use(requireAdmin);

// AI Features
router.get("/ai/contracts", getAiContracts);
router.get("/ai/analysis", getAiAnalysis);

// Marketing
router.get("/marketing/campaigns", getEmailCampaigns);
router.post("/marketing/campaigns", createEmailCampaign);

// Security
router.get("/security/blocked-ips", getBlockedIps);
router.post("/security/blocked-ips", blockIp);
router.delete("/security/blocked-ips/:ip", unblockIp);
router.get("/security/ddos-logs", getDdosLogs);
router.get("/security/failed-logins", getFailedLogins);

export default router;
