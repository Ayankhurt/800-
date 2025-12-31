import express from "express";
import { createJob, getJobs, getJobById, updateJob, deleteJob, getJobApplications } from "../controllers/jobController.js";
import { applyToJob, updateApplicationStatus } from "../controllers/applicationController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { validate, jobSchema } from "../utils/validators.js";

const router = express.Router();

router.post("/", authenticateUser, validate(jobSchema), createJob);
router.get("/", getJobs);
router.get("/:id/applications", authenticateUser, getJobApplications);
router.post("/:id/apply", authenticateUser, (req, res, next) => {
    // Map jobId from params to body for compatibility with applicationController.applyToJob
    req.body.job_id = req.params.id;
    next();
}, applyToJob);
router.put("/applications/:id/status", authenticateUser, updateApplicationStatus); // Alias for frontend compatibility
router.get("/:id", getJobById);
router.put("/:id", authenticateUser, updateJob);
router.delete("/:id", authenticateUser, deleteJob);

export default router;
