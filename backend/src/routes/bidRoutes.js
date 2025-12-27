import express from "express";
import { placeBid, getJobBids, getMyBids, updateBidStatus, withdrawBid, getAllBids, submitBidResponse, createBidRequest, getBidDetails, compareBids } from "../controllers/bidController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticateUser, getAllBids); // Unified route to get all relevant bids
router.post("/", authenticateUser, createBidRequest);
router.post("/:id/submit", authenticateUser, submitBidResponse);
router.get("/:id/compare", authenticateUser, compareBids);
router.get("/job/:job_id", authenticateUser, getJobBids);
router.get("/:job_id/submissions", authenticateUser, getJobBids);
router.get("/my-bids", authenticateUser, getMyBids);
router.get("/:id", authenticateUser, getBidDetails);
router.put("/:id/status", authenticateUser, updateBidStatus);
router.put("/:id/withdraw", authenticateUser, withdrawBid);

export default router;

