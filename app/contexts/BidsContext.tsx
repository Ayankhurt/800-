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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [storedBids, storedSubmissions] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BIDS),
        AsyncStorage.getItem(STORAGE_KEYS.BID_SUBMISSIONS),
      ]);

      let initialBids = storedBids ? JSON.parse(storedBids) : [];
      let initialSubmissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];

      // Fetch from API if logged in
      if (user) {
        try {
          const [bidsResponse, submissionsResponse] = await Promise.all([
            bidsAPI.getAll(),
            bidsAPI.getMyBids() // This unified route in backend now returns relevant job apps/bids
          ]);

          if (bidsResponse.success && bidsResponse.data) {
            const rawData = bidsResponse.data.bids || (Array.isArray(bidsResponse.data) ? bidsResponse.data : []);
            initialBids = rawData.map((bid: any) => ({
              id: bid.id || bid.bid_id,
              projectName: bid.project?.title || bid.project_name || bid.projectName || bid.title || "Unnamed Project",
              description: bid.notes || bid.description || "No description provided",
              dueDate: bid.due_date || bid.dueDate || bid.created_at,
              status: (bid.status || "pending") as BidStatus,
              budget: bid.amount ? `$${bid.amount}` : (bid.budget || "TBD"),
              contractorCount: bid.contractor_count || bid.contractorCount || 0,
              submittedCount: bid.submitted_count || bid.submittedCount || 0,
              createdAt: bid.created_at || bid.createdAt,
            }));
          }

          if (submissionsResponse.success && submissionsResponse.data) {
            const rawSubs = Array.isArray(submissionsResponse.data) ? submissionsResponse.data : [];
            initialSubmissions = rawSubs.map((sub: any) => ({
              id: sub.id,
              bidId: sub.bid_id || sub.job_id,
              contractorId: sub.contractor_id,
              amount: sub.amount || sub.proposed_rate,
              status: sub.status,
              submittedAt: sub.created_at
            }));
          }
        } catch (apiError) {
          console.error("Failed to fetch data from API:", apiError);
        }
      }

      setBids(initialBids);
      setBidSubmissions(initialSubmissions);
    } catch (error) {
      console.error("Failed to load bids data:", error);
      setBids([]);
      setBidSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBids = useCallback(async (updatedBids: Bid[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(updatedBids));
      setBids(updatedBids);
    } catch (error) {
      console.error("Failed to save bids:", error);
    }
  }, []);

  const saveBidSubmissions = useCallback(async (updatedSubmissions: BidSubmission[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BID_SUBMISSIONS, JSON.stringify(updatedSubmissions));
      setBidSubmissions(updatedSubmissions);
    } catch (error) {
      console.error("Failed to save bid submissions:", error);
    }
  }, []);

  const createBid = useCallback(async (bidData: Omit<Bid, "id" | "createdAt" | "submittedCount">) => {
    if (!user) return null;

    const newBid: Bid = {
      ...bidData,
      id: `bid-${Date.now()}`,
      createdAt: new Date().toISOString(),
      submittedCount: 0,
    };

    const updatedBids = [...bids, newBid];
    await saveBids(updatedBids);

    return newBid;
  }, [bids, saveBids, user]);

  const updateBid = useCallback(async (bidId: string, updates: Partial<Bid>) => {
    const updatedBids = bids.map(bid =>
      bid.id === bidId ? { ...bid, ...updates } : bid
    );
    await saveBids(updatedBids);
  }, [bids, saveBids]);

  const deleteBid = useCallback(async (bidId: string) => {
    const updatedBids = bids.filter(bid => bid.id !== bidId);
    await saveBids(updatedBids);

    const updatedSubmissions = bidSubmissions.filter(sub => sub.bidId !== bidId);
    await saveBidSubmissions(updatedSubmissions);
  }, [bids, bidSubmissions, saveBids, saveBidSubmissions]);

  const submitBid = useCallback(async (
    bidId: string,
    submissionData: {
      amount: number;
      notes: string;
      documents?: string[];
    }
  ) => {
    if (!user) return null;

    const bid = bids.find(b => b.id === bidId);
    if (!bid) return null;

    const existingSubmission = bidSubmissions.find(
      sub => sub.bidId === bidId && sub.contractorId === user.id
    );
    if (existingSubmission) {
      return null;
    }

    const newSubmission: BidSubmission = {
      id: `sub-${Date.now()}`,
      bidId,
      contractorId: user.id,
      contractorName: user.fullName,
      contractorCompany: user.company || "",
      amount: submissionData.amount,
      notes: submissionData.notes,
      submittedAt: new Date().toISOString(),
      documents: submissionData.documents || [],
      createdBy: user.id, // Always set to current user id
    };

    const updatedSubmissions = [...bidSubmissions, newSubmission];
    await saveBidSubmissions(updatedSubmissions);

    const updatedBids = bids.map(b =>
      b.id === bidId
        ? { ...b, submittedCount: b.submittedCount + 1, status: "submitted" as const }
        : b
    );
    await saveBids(updatedBids);

    return newSubmission;
  }, [bids, bidSubmissions, saveBids, saveBidSubmissions, user]);

  const awardBid = useCallback(async (bidId: string, submissionId: string) => {
    const updatedBids = bids.map(bid =>
      bid.id === bidId ? { ...bid, status: "awarded" as const } : bid
    );
    await saveBids(updatedBids);
  }, [bids, saveBids]);

  const declineBid = useCallback(async (bidId: string) => {
    const updatedBids = bids.map(bid =>
      bid.id === bidId ? { ...bid, status: "declined" as const } : bid
    );
    await saveBids(updatedBids);
  }, [bids, saveBids]);

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
  ]);
});
