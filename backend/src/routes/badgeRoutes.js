import express from "express";
import {
    getAvailableBadges,
    assignBadge,
    getUserBadges
} from "../controllers/badgeController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

router.get("/", getAvailableBadges);
router.post("/assign", authenticateUser, requireAdmin, assignBadge);
router.get("/user/:user_id", getUserBadges);

export default router;
