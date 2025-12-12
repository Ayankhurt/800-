import express from "express";
import {
    createTemplate,
    getMyTemplates,
    deleteTemplate
} from "../controllers/templateController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, createTemplate);
router.get("/", authenticateUser, getMyTemplates);
router.delete("/:id", authenticateUser, deleteTemplate);

export default router;
