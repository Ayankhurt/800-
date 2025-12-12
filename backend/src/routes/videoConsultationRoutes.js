import express from "express";
import {
    requestConsultation,
    getMyConsultations,
    updateConsultationStatus
} from "../controllers/videoConsultationController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, requestConsultation);
router.get("/", authenticateUser, getMyConsultations);
router.put("/:id/status", authenticateUser, updateConsultationStatus);

export default router;
