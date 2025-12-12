import express from "express";
import {
    getMyProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    createMilestone,
    updateMilestoneStatus
} from "../controllers/projectController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticateUser, getMyProjects);
router.post("/", authenticateUser, createProject);
router.get("/:id", authenticateUser, getProjectById);
router.put("/:id", authenticateUser, updateProject);
router.delete("/:id", authenticateUser, deleteProject);

router.post("/:project_id/milestones", authenticateUser, createMilestone);
router.put("/milestones/:id/status", authenticateUser, updateMilestoneStatus);

export default router;
