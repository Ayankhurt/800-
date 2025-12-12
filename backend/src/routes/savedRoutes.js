import express from "express";
import {
    saveContractor,
    getSavedContractors,
    unsaveContractor,
    checkIfSaved
} from "../controllers/savedController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, saveContractor);
router.get("/", authenticateUser, getSavedContractors);
router.delete("/:contractor_id", authenticateUser, unsaveContractor);
router.get("/check/:contractor_id", authenticateUser, checkIfSaved);

export default router;
