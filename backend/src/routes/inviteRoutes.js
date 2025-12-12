import express from "express";
import {
    inviteContractor,
    getMyInvites,
    respondToInvite,
    getSentInvites
} from "../controllers/inviteController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, inviteContractor);
router.get("/my-invites", authenticateUser, getMyInvites);
router.put("/:id/respond", authenticateUser, respondToInvite);
router.get("/job/:job_id", authenticateUser, getSentInvites);

export default router;
