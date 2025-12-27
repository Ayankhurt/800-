import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Dispute, DisputeType, DisputeStatus } from "@/types";
import { useAuth } from "./AuthContext";
import { disputesAPI } from "@/services/api";

export const [DisputesContext, useDisputes] = createContextHook(() => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDisputes = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await disputesAPI.getAll();
      if (response.success && response.data) {
        // Handle both simple array and object-wrapped responses
        const rawDisputes = response.data.disputes || (Array.isArray(response.data) ? response.data : []);

        const mappedDisputes: Dispute[] = rawDisputes.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          milestoneId: d.milestone_id,
          filedBy: d.raised_by,
          filedByName: d.raised_by_user ? `${d.raised_by_user.first_name} ${d.raised_by_user.last_name}` : "Unknown User",
          disputeType: (d.reason || "contract") as DisputeType,
          description: d.description || "",
          evidence: d.evidence || { photos: [], documents: [], messages: [] },
          amountDisputed: d.amount_disputed,
          desiredResolution: d.desired_resolution || "",
          status: (d.status || "filed") as DisputeStatus,
          resolutionStage: (d.resolution_stage || "internal"),
          adminAssigned: d.admin_assigned,
          resolution: d.resolution,
          resolvedAt: d.resolved_at,
          createdAt: d.created_at,
        }));
        setDisputes(mappedDisputes);
      }
    } catch (error) {
      console.error("[DisputesContext] Error loading disputes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  const fileDispute = useCallback(
    async (
      projectId: string,
      disputeType: DisputeType,
      description: string,
      evidence: { photos: string[]; documents: string[]; messages: string[] },
      amountDisputed?: number,
      desiredResolution?: string,
      milestoneId?: string
    ) => {
      if (!user) return;

      try {
        const response = await disputesAPI.create({
          project_id: projectId,
          milestone_id: milestoneId,
          reason: disputeType,
          description,
          evidence,
          amount_disputed: amountDisputed,
          desired_resolution: desiredResolution,
        });

        if (response.success) {
          await loadDisputes();
          return response.data;
        }
      } catch (error) {
        console.error("[DisputesContext] Error filing dispute:", error);
        throw error;
      }
    },
    [user, loadDisputes]
  );

  const updateDisputeStatus = useCallback(
    async (disputeId: string, status: DisputeStatus, resolution?: string, resolutionNotes?: string) => {
      try {
        let response;
        if (status === "resolved") {
          response = await disputesAPI.resolve(disputeId, {
            resolution: resolution || "Resolved",
            resolution_notes: resolutionNotes || "Admin action"
          });
        } else if (status === "closed") {
          response = await disputesAPI.close(disputeId);
        }

        if (response?.success) {
          await loadDisputes();
        }
      } catch (error) {
        console.error("[DisputesContext] Error updating dispute status:", error);
      }
    },
    [loadDisputes]
  );

  const escalateDispute = useCallback(
    async (disputeId: string, stage: Dispute["resolutionStage"]) => {
      // Backend doesn't have a direct escalate endpoint yet in disputeController, 
      // but we can update the dispute metadata if needed. 
      // For now, update local state or add to API if necessary.
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, resolutionStage: stage } : d));
    },
    []
  );

  const addEvidence = useCallback(
    async (disputeId: string, evidence: { photos?: string[]; documents?: string[]; messages?: string[] }) => {
      try {
        const dispute = disputes.find(d => d.id === disputeId);
        if (!dispute) return;

        const mergedEvidence = {
          photos: [...(dispute.evidence?.photos || []), ...(evidence.photos || [])],
          documents: [...(dispute.evidence?.documents || []), ...(evidence.documents || [])],
          messages: [...(dispute.evidence?.messages || []), ...(evidence.messages || [])],
        };

        const response = await disputesAPI.addResponse(disputeId, "Added new evidence", mergedEvidence as any);
        if (response.success) {
          await loadDisputes();
        }
      } catch (error) {
        console.error("[DisputesContext] Error adding evidence:", error);
      }
    },
    [disputes, loadDisputes]
  );

  const getDisputesForProject = useCallback(
    (projectId: string) => {
      return disputes.filter((d) => d.projectId === projectId);
    },
    [disputes]
  );

  const getActiveDisputes = useCallback(() => {
    return disputes.filter((d) => d.status !== "resolved" && d.status !== "closed");
  }, [disputes]);

  const value = useMemo(
    () => ({
      disputes,
      isLoading,
      fileDispute,
      updateDisputeStatus,
      escalateDispute,
      addEvidence,
      getDisputesForProject,
      getActiveDisputes,
      refreshDisputes: loadDisputes,
    }),
    [
      disputes,
      isLoading,
      fileDispute,
      updateDisputeStatus,
      escalateDispute,
      addEvidence,
      getDisputesForProject,
      getActiveDisputes,
      loadDisputes,
    ]
  );

  return value;
});

