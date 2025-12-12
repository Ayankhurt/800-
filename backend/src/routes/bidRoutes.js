import express from "express";
import { placeBid, getJobBids, getMyBids, updateBidStatus, withdrawBid, getAllBids } from "../controllers/bidController.js";
import { authenticateUser } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getAllBids); // Public route to get all bids
router.post("/", authenticateUser, placeBid);
router.get("/job/:job_id", authenticateUser, getJobBids);
router.get("/my-bids", authenticateUser, getMyBids);
router.put("/:id/status", authenticateUser, updateBidStatus);
router.put("/:id/withdraw", authenticateUser, withdrawBid);

export default router;

