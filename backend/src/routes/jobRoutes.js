import express from "express";
import { createJob, getJobs, getJobById, updateJob, deleteJob } from "../controllers/jobController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, createJob);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.put("/:id", authenticateUser, updateJob);
router.delete("/:id", authenticateUser, deleteJob);

export default router;
