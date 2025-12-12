import express from "express";
import {
    getContractorProfile,
    updateContractorProfile,
    addPortfolioItem,
    getPortfolioItems,
    deletePortfolioItem,
    addCertification,
    getCertifications,
    deleteCertification,
    searchContractors
} from "../controllers/contractorController.js";
import { authenticateUser } from "../middlewares/auth.js";
import { requirePermission } from "../middlewares/rbac.js";

const router = express.Router();

// Public routes
router.get("/search", searchContractors);
router.get("/:id", getContractorProfile);
router.get("/:contractor_id/portfolio", getPortfolioItems);
router.get("/:contractor_id/certifications", getCertifications);

// Protected routes
router.put("/profile", authenticateUser, updateContractorProfile);

// Portfolio
router.post("/portfolio", authenticateUser, addPortfolioItem);
router.delete("/portfolio/:id", authenticateUser, deletePortfolioItem);

// Certifications
router.post("/certifications", authenticateUser, addCertification);
router.delete("/certifications/:id", authenticateUser, deleteCertification);

export default router;
