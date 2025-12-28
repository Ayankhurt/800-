import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bid, BidSubmission, BidStatus } from "@/types";
import { useAuth } from "./AuthContext";
import { bidsAPI } from "@/services/api";

const STORAGE_KEYS = {
  BIDS: "bids",
  BID_SUBMISSIONS: "bid_submissions",
};

// Mock data removed - app now uses 100% real API data from backend

export const [BidsProvider, useBids] = createContextHook(() => {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidSubmissions, setBidSubmissions] = useState<BidSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setBids([]);
      setBidSubmissions([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetch from API
      const [bidsResponse, submissionsResponse] = await Promise.all([
        bidsAPI.getAll(),
        bidsAPI.getMyBids()
      ]);

      if (bidsResponse.success && bidsResponse.data) {
        const rawData = bidsResponse.data.bids || (Array.isArray(bidsResponse.data) ? bidsResponse.data : []);
        const mappedBids = rawData.map((bid: any) => {
          // Parse budget from descriptions if amount is missing
          // descriptions often looks like "[Budget: $1000]\n\nActual description"
          let budget = bid.amount ? `$${bid.amount}` : "TBD";
          let description = bid.descriptions || bid.notes || bid.description || "No description provided";

          if (budget === "TBD" && description.includes("[Budget: $")) {
            const match = description.match(/\[Budget: \$(\d+)\]/);
            if (match) {
              budget = `$${match[1]}`;
              // Optionally strip the budget tag from description for cleaner UI
              description = description.replace(/\[Budget: \$(\d+)\]\n\n/, "").trim();
            }
          }

          if (budget === "TBD") {
            if (bid.project?.budget_min && bid.project?.budget_max) {
              budget = `$${bid.project.budget_min} - $${bid.project.budget_max}`;
            } else if (bid.budget_min && bid.budget_max) {
              budget = `$${bid.budget_min} - $${bid.budget_max}`;
            } else if (bid.budget) {
              budget = bid.budget;
            }
          }

          return {
            id: bid.id || bid.bid_id,
            projectName: bid.project?.title || bid.project_name || bid.projectName || bid.title || "Unnamed Project",
            description: description,
            dueDate: bid.due_date || bid.dueDate || bid.created_at,
            status: (bid.status || "pending") as BidStatus,
            budget: budget,
            contractorCount: bid.contractor_count || bid.contractorCount || 0,
            submittedCount: bid.submitted_count || bid.submittedCount || 0,
            createdAt: bid.created_at || bid.createdAt,
            projectManagerId: bid.project_manager_id || bid.owner_id,
            jobId: bid.job_id || bid.jobs_id,
          };
        });
        setBids(mappedBids);
      }

      if (submissionsResponse.success && submissionsResponse.data) {
        const rawSubs = Array.isArray(submissionsResponse.data) ? submissionsResponse.data : [];
        const mappedSubs = rawSubs.map((sub: any) => ({
          id: sub.id,
          bidId: sub.bid_id || sub.job_id,
          contractorId: sub.contractor_id,
          amount: sub.amount || sub.proposed_rate,
          status: sub.status,
          submittedAt: sub.created_at
        }));
        setBidSubmissions(mappedSubs);
      }
    } catch (error) {
      console.error("[BidsContext] Failed to load bids data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBid = useCallback(async (bidData: any) => {
    try {
      const response = await bidsAPI.create(bidData);
      if (response.success) {
        await loadData();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("[BidsContext] Create bid failed:", error);
      return null;
    }
  }, [loadData]);

  const updateBid = useCallback(async (bidId: string, updates: Partial<Bid>) => {
    // Only implemented locally for now, should call API if needed
    setBids(prev => prev.map(bid => bid.id === bidId ? { ...bid, ...updates } : bid));
  }, []);

  const deleteBid = useCallback(async (bidId: string) => {
    // Only implemented locally for now
    setBids(prev => prev.filter(bid => bid.id !== bidId));
  }, []);

  const submitBid = useCallback(async (bidId: string, submissionData: any) => {
    try {
      const response = await bidsAPI.submit(bidId, submissionData);
      if (response.success) {
        await loadData();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("[BidsContext] Submit bid failed:", error);
      return null;
    }
  }, [loadData]);

  const awardBid = useCallback(async (bidId: string, submissionId: string) => {
    try {
      const response = await bidsAPI.awardSubmission(bidId, submissionId);
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error("[BidsContext] Award bid failed:", error);
    }
  }, [loadData]);

  const declineBid = useCallback(async (bidId: string) => {
    setBids(prev => prev.map(bid => bid.id === bidId ? { ...bid, status: "declined" as const } : bid));
  }, []);

  const getBidById = useCallback((bidId: string) => {
    return bids.find(bid => bid.id === bidId);
  }, [bids]);

  const getSubmissionsByBidId = useCallback((bidId: string) => {
    return bidSubmissions.filter(sub => sub.bidId === bidId);
  }, [bidSubmissions]);

  const getSubmissionsByUserId = useCallback((userId: string) => {
    return bidSubmissions.filter(sub => sub.contractorId === userId);
  }, [bidSubmissions]);

  const hasUserSubmitted = useCallback((bidId: string, userId: string) => {
    return bidSubmissions.some(sub => sub.bidId === bidId && sub.contractorId === userId);
  }, [bidSubmissions]);

  return useMemo(() => ({
    bids,
    bidSubmissions,
    isLoading,
    createBid,
    updateBid,
    deleteBid,
    submitBid,
    awardBid,
    declineBid,
    getBidById,
    getSubmissionsByBidId,
    getSubmissionsByUserId,
    hasUserSubmitted,
    refreshBids: loadData
  }), [
    bids,
    bidSubmissions,
    isLoading,
    createBid,
    updateBid,
    deleteBid,
    submitBid,
    awardBid,
    declineBid,
    getBidById,
    getSubmissionsByBidId,
    getSubmissionsByUserId,
    hasUserSubmitted,
    loadData
  ]);
});
