import express from "express";
import { createReview, getUserReviews, respondToReview } from "../controllers/reviewController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateUser, createReview);
router.get("/user/:user_id", getUserReviews);
router.post("/:reviewId/respond", authenticateUser, respondToReview);

export default router;

