import express from "express";
import {
    getMyReferralCode,
    applyReferralCode,
    getMyReferrals,
    getReferralStats
} from "../controllers/referralController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.get("/code", authenticateUser, getMyReferralCode);
router.post("/apply", authenticateUser, applyReferralCode);
router.get("/my-referrals", authenticateUser, getMyReferrals);
router.get("/stats", authenticateUser, getReferralStats);

export default router;
