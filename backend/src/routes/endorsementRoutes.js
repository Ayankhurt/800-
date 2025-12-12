import express from "express";
import {
    giveEndorsement,
    getEndorsements,
    removeEndorsement
} from "../controllers/endorsementController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, giveEndorsement);
router.get("/:contractor_id", getEndorsements);
router.delete("/:id", authenticateUser, removeEndorsement);

export default router;
