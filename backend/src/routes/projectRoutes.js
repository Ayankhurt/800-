import express from "express";
import {
    getMyProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    createMilestone,
    updateMilestoneStatus,
    getMilestones,
    getMilestoneById,
    getProgressUpdates,
    createProgressUpdate
} from "../controllers/projectController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticateUser, getMyProjects);
router.post("/", authenticateUser, createProject);
router.get("/:id", authenticateUser, getProjectById);
router.put("/:id", authenticateUser, updateProject);
router.delete("/:id", authenticateUser, deleteProject);


router.get("/:project_id/milestones", authenticateUser, getMilestones);
router.post("/:project_id/milestones", authenticateUser, createMilestone);
router.get("/milestones/:id", authenticateUser, getMilestoneById);
router.put("/milestones/:id/status", authenticateUser, updateMilestoneStatus);

// Progress Updates
router.get("/:project_id/progress", authenticateUser, getProgressUpdates);
router.post("/:project_id/progress", authenticateUser, createProgressUpdate);

export default router;
