import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Project,
  ScopeOfWork,
  ProjectContract,
  Milestone,
  ProgressUpdate,
  ProjectPayment,
  ChangeOrder,
  Dispute,
  MilestoneApproval,
  ProjectDocument,
  PunchListItem,
  MilestoneStatus,
  DisputeStatus,
  ChangeOrderStatus,
} from "@/types";
import { useAuth } from "./AuthContext";
import { projectsAPI, milestonesAPI } from "@/services/api";

const STORAGE_KEYS = {
  PROJECTS: "projects",
  SCOPES: "scopes",
  CONTRACTS: "contracts",
  MILESTONES: "milestones",
  PROGRESS_UPDATES: "progress_updates",
  PAYMENTS: "payments",
  CHANGE_ORDERS: "change_orders",
  DISPUTES: "disputes",
  DOCUMENTS: "documents",
  PUNCH_LIST: "punch_list",
};

export const [ProjectsProvider, useProjects] = createContextHook(() => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [scopes, setScopes] = useState<ScopeOfWork[]>([]);
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [punchList, setPunchList] = useState<PunchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await projectsAPI.getAll();
      if (response.success && response.data) {
        const mappedProjects: Project[] = response.data.map((p: any) => ({
          ...p,
          id: p.id,
          title: p.title || "Unnamed Project",
          description: p.description || "",
          ownerId: p.owner_id,
          contractorId: p.contractor_id,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          completionPercentage: p.completion_percentage || 0,
          paidAmount: p.paid_amount || 0,
          totalAmount: p.total_amount || p.budget || 0,
          escrowBalance: p.escrow_balance || 0,
          startDate: p.start_date || p.created_at,
          endDate: p.end_date,
        }));
        setProjects(mappedProjects);
      } else {
        // Fallback to local storage if API fails or returns nothing
        const storedProjects = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (storedProjects) setProjects(JSON.parse(storedProjects));
      }

      // Load other data from storage for now to maintain consistency
      const [
        storedScopes,
        storedContracts,
        storedMilestones,
        storedUpdates,
        storedPayments,
        storedChangeOrders,
        storedDisputes,
        storedDocuments,
        storedPunchList,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SCOPES),
        AsyncStorage.getItem(STORAGE_KEYS.CONTRACTS),
        AsyncStorage.getItem(STORAGE_KEYS.MILESTONES),
        AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_UPDATES),
        AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.CHANGE_ORDERS),
        AsyncStorage.getItem(STORAGE_KEYS.DISPUTES),
        AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.PUNCH_LIST),
      ]);

      setScopes(storedScopes ? JSON.parse(storedScopes) : []);
      setContracts(storedContracts ? JSON.parse(storedContracts) : []);
      setMilestones(storedMilestones ? JSON.parse(storedMilestones) : []);
      setProgressUpdates(storedUpdates ? JSON.parse(storedUpdates) : []);
      setPayments(storedPayments ? JSON.parse(storedPayments) : []);
      setChangeOrders(storedChangeOrders ? JSON.parse(storedChangeOrders) : []);
      setDisputes(storedDisputes ? JSON.parse(storedDisputes) : []);
      setDocuments(storedDocuments ? JSON.parse(storedDocuments) : []);
      setPunchList(storedPunchList ? JSON.parse(storedPunchList) : []);
    } catch (error) {
      console.error("Failed to load project data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProjects = useCallback(async (updatedProjects: Project[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Failed to save projects:", error);
    }
  }, []);

  const saveScopes = useCallback(async (updatedScopes: ScopeOfWork[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCOPES, JSON.stringify(updatedScopes));
      setScopes(updatedScopes);
    } catch (error) {
      console.error("Failed to save scopes:", error);
    }
  }, []);

  const saveContracts = useCallback(async (updatedContracts: ProjectContract[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(updatedContracts));
      setContracts(updatedContracts);
    } catch (error) {
      console.error("Failed to save contracts:", error);
    }
  }, []);

  const saveMilestones = useCallback(async (updatedMilestones: Milestone[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(updatedMilestones));
      setMilestones(updatedMilestones);
    } catch (error) {
      console.error("Failed to save milestones:", error);
    }
  }, []);

  const saveProgressUpdates = useCallback(async (updatedUpdates: ProgressUpdate[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS_UPDATES, JSON.stringify(updatedUpdates));
      setProgressUpdates(updatedUpdates);
    } catch (error) {
      console.error("Failed to save progress updates:", error);
    }
  }, []);

  const savePayments = useCallback(async (updatedPayments: ProjectPayment[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
      setPayments(updatedPayments);
    } catch (error) {
      console.error("Failed to save payments:", error);
    }
  }, []);

  const saveChangeOrders = useCallback(async (updatedChangeOrders: ChangeOrder[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHANGE_ORDERS, JSON.stringify(updatedChangeOrders));
      setChangeOrders(updatedChangeOrders);
    } catch (error) {
      console.error("Failed to save change orders:", error);
    }
  }, []);

  const saveDisputes = useCallback(async (updatedDisputes: Dispute[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(updatedDisputes));
      setDisputes(updatedDisputes);
    } catch (error) {
      console.error("Failed to save disputes:", error);
    }
  }, []);

  const saveDocuments = useCallback(async (updatedDocuments: ProjectDocument[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updatedDocuments));
      setDocuments(updatedDocuments);
    } catch (error) {
      console.error("Failed to save documents:", error);
    }
  }, []);

  const savePunchList = useCallback(async (updatedPunchList: PunchListItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PUNCH_LIST, JSON.stringify(updatedPunchList));
      setPunchList(updatedPunchList);
    } catch (error) {
      console.error("Failed to save punch list:", error);
    }
  }, []);

  const createProject = useCallback(async (projectData: Omit<Project, "id" | "createdAt" | "updatedAt" | "completionPercentage" | "paidAmount">) => {
    if (!user) return null;

    try {
      const response = await projectsAPI.create({
        ...projectData,
        owner_id: user.id,
      });

      if (response.success) {
        await loadData();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("[ProjectsContext] Create project failed:", error);
      return null;
    }
  }, [user, loadData]);

  const updateProjectStatus = useCallback(async (projectId: string, status: Project["status"]) => {
    try {
      const response = await projectsAPI.update(projectId, { status });
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error("[ProjectsContext] Update project status failed:", error);
    }
  }, [loadData]);

  const createScopeOfWork = useCallback(async (scopeData: Omit<ScopeOfWork, "id" | "createdAt" | "version">) => {
    const existingScopes = scopes.filter(s => s.projectId === scopeData.projectId);
    const newScope: ScopeOfWork = {
      ...scopeData,
      id: `scope-${Date.now()}`,
      version: existingScopes.length + 1,
      createdAt: new Date().toISOString(),
    };

    const updatedScopes = [...scopes, newScope];
    await saveScopes(updatedScopes);

    return newScope;
  }, [scopes, saveScopes]);

  const createContract = useCallback(async (contractData: Omit<ProjectContract, "id" | "createdAt" | "fullyExecutedAt">) => {
    const newContract: ProjectContract = {
      ...contractData,
      id: `contract-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedContracts = [...contracts, newContract];
    await saveContracts(updatedContracts);

    return newContract;
  }, [contracts, saveContracts]);

  const signContract = useCallback(async (contractId: string, signature: string, role: "owner" | "contractor") => {
    const updatedContracts = contracts.map(contract => {
      if (contract.id === contractId) {
        const updated = { ...contract };
        if (role === "owner") {
          updated.ownerSigned = true;
          updated.ownerSignature = signature;
          updated.ownerSignedAt = new Date().toISOString();
        } else {
          updated.contractorSigned = true;
          updated.contractorSignature = signature;
          updated.contractorSignedAt = new Date().toISOString();
        }
        if (updated.ownerSigned && updated.contractorSigned && !updated.fullyExecutedAt) {
          updated.fullyExecutedAt = new Date().toISOString();
        }
        return updated;
      }
      return contract;
    });
    await saveContracts(updatedContracts);
  }, [contracts, saveContracts]);

  const createMilestone = useCallback(async (milestoneData: Omit<Milestone, "id" | "createdAt" | "updatedAt" | "revisionCount">) => {
    try {
      const response = await milestonesAPI.create(milestoneData.projectId, {
        title: milestoneData.title,
        description: milestoneData.description,
        due_date: milestoneData.dueDate,
        amount: milestoneData.paymentAmount,
        order_index: milestoneData.orderNumber,
      });

      if (response.success) {
        await loadData();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("[ProjectsContext] Create milestone failed:", error);
      return null;
    }
  }, [loadData]);

  const updateMilestoneStatus = useCallback(async (milestoneId: string, status: MilestoneStatus, metadata?: any) => {
    try {
      // Mapping frontend status to backend if necessary
      const response = await milestonesAPI.updateStatus(milestoneId, status, metadata);
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error("[ProjectsContext] Update milestone status failed:", error);
    }
  }, [loadData]);

  const addProgressUpdate = useCallback(async (updateData: Omit<ProgressUpdate, "id" | "createdAt">) => {
    const newUpdate: ProgressUpdate = {
      ...updateData,
      id: `update-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedUpdates = [...progressUpdates, newUpdate];
    await saveProgressUpdates(updatedUpdates);

    return newUpdate;
  }, [progressUpdates, saveProgressUpdates]);

  const createPayment = useCallback(async (paymentData: Omit<ProjectPayment, "id" | "createdAt">) => {
    const newPayment: ProjectPayment = {
      ...paymentData,
      id: `payment-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [...payments, newPayment];
    await savePayments(updatedPayments);

    if (newPayment.status === "completed" && !newPayment.escrowHeld) {
      const project = projects.find(p => p.id === newPayment.projectId);
      if (project) {
        const updatedProjects = projects.map(p =>
          p.id === newPayment.projectId
            ? {
              ...p,
              paidAmount: p.paidAmount + newPayment.amount,
              escrowBalance: p.escrowBalance - newPayment.amount,
              updatedAt: new Date().toISOString(),
            }
            : p
        );
        await saveProjects(updatedProjects);
      }
    }

    return newPayment;
  }, [payments, projects, savePayments, saveProjects]);

  const releasePayment = useCallback(async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment || !payment.escrowHeld) return;

    const updatedPayments = payments.map(p =>
      p.id === paymentId
        ? { ...p, escrowHeld: false, releasedAt: new Date().toISOString(), status: "completed" as const }
        : p
    );
    await savePayments(updatedPayments);

    const project = projects.find(p => p.id === payment.projectId);
    if (project) {
      const updatedProjects = projects.map(p =>
        p.id === payment.projectId
          ? {
            ...p,
            paidAmount: p.paidAmount + payment.amount,
            escrowBalance: p.escrowBalance - payment.amount,
            updatedAt: new Date().toISOString(),
          }
          : p
      );
      await saveProjects(updatedProjects);
    }
  }, [payments, projects, savePayments, saveProjects]);

  const createChangeOrder = useCallback(async (changeOrderData: Omit<ChangeOrder, "id" | "createdAt">) => {
    const newChangeOrder: ChangeOrder = {
      ...changeOrderData,
      id: `co-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedChangeOrders = [...changeOrders, newChangeOrder];
    await saveChangeOrders(updatedChangeOrders);

    return newChangeOrder;
  }, [changeOrders, saveChangeOrders]);

  const updateChangeOrderStatus = useCallback(async (changeOrderId: string, status: ChangeOrderStatus) => {
    const updatedChangeOrders = changeOrders.map(co => {
      if (co.id === changeOrderId) {
        const updated = { ...co, status };
        if (status === "approved") {
          updated.approvedAt = new Date().toISOString();
        }
        return updated;
      }
      return co;
    });
    await saveChangeOrders(updatedChangeOrders);

    const changeOrder = changeOrders.find(co => co.id === changeOrderId);
    if (changeOrder && status === "implemented") {
      const project = projects.find(p => p.id === changeOrder.projectId);
      if (project) {
        const updatedProjects = projects.map(p =>
          p.id === changeOrder.projectId
            ? {
              ...p,
              totalAmount: p.totalAmount + changeOrder.costImpact,
              escrowBalance: p.escrowBalance + changeOrder.costImpact,
              updatedAt: new Date().toISOString(),
            }
            : p
        );
        await saveProjects(updatedProjects);
      }
    }
  }, [changeOrders, projects, saveChangeOrders, saveProjects]);

  const fileDispute = useCallback(async (disputeData: Omit<Dispute, "id" | "createdAt" | "resolutionStage">) => {
    const newDispute: Dispute = {
      ...disputeData,
      id: `dispute-${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolutionStage: "internal",
    };

    const updatedDisputes = [...disputes, newDispute];
    await saveDisputes(updatedDisputes);

    return newDispute;
  }, [disputes, saveDisputes]);

  const updateDisputeStatus = useCallback(async (disputeId: string, status: DisputeStatus, resolution?: string) => {
    const updatedDisputes = disputes.map(dispute => {
      if (dispute.id === disputeId) {
        const updated = { ...dispute, status };
        if (status === "resolved" || status === "closed") {
          updated.resolvedAt = new Date().toISOString();
          if (resolution) updated.resolution = resolution;
        }
        return updated;
      }
      return dispute;
    });
    await saveDisputes(updatedDisputes);
  }, [disputes, saveDisputes]);

  const addPunchListItem = useCallback(async (itemData: Omit<PunchListItem, "id" | "createdAt">) => {
    const newItem: PunchListItem = {
      ...itemData,
      id: `punch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedPunchList = [...punchList, newItem];
    await savePunchList(updatedPunchList);

    return newItem;
  }, [punchList, savePunchList]);

  const updatePunchListItem = useCallback(async (itemId: string, updates: Partial<PunchListItem>) => {
    const updatedPunchList = punchList.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        if (updates.status === "completed" && !item.completedAt) {
          updated.completedAt = new Date().toISOString();
        }
        return updated;
      }
      return item;
    });
    await savePunchList(updatedPunchList);
  }, [punchList, savePunchList]);

  const getProjectById = useCallback((projectId: string) => {
    return projects.find(p => p.id === projectId);
  }, [projects]);

  const getScopeByProjectId = useCallback((projectId: string) => {
    return scopes
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.version - a.version)[0];
  }, [scopes]);

  const getContractByProjectId = useCallback((projectId: string) => {
    return contracts.find(c => c.projectId === projectId);
  }, [contracts]);

  const getMilestonesByProjectId = useCallback((projectId: string) => {
    return milestones
      .filter(m => m.projectId === projectId)
      .sort((a, b) => a.orderNumber - b.orderNumber);
  }, [milestones]);

  const getProgressUpdatesByProjectId = useCallback((projectId: string) => {
    return progressUpdates
      .filter(u => u.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [progressUpdates]);

  const getPaymentsByProjectId = useCallback((projectId: string) => {
    return payments
      .filter(p => p.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payments]);

  const getChangeOrdersByProjectId = useCallback((projectId: string) => {
    return changeOrders
      .filter(co => co.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [changeOrders]);

  const getDisputesByProjectId = useCallback((projectId: string) => {
    return disputes
      .filter(d => d.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [disputes]);

  const getPunchListByProjectId = useCallback((projectId: string) => {
    return punchList.filter(item => item.projectId === projectId);
  }, [punchList]);

  const getUserProjects = useCallback(() => {
    if (!user) return [];
    // Admin sees ALL projects, others see only their own
    if (user.role === "ADMIN") {
      return projects; // Return all projects for admin
    }
    return projects.filter(p => p.ownerId === user.id || p.contractorId === user.id);
  }, [projects, user]);

  return useMemo(() => ({
    projects,
    scopes,
    contracts,
    milestones,
    progressUpdates,
    payments,
    changeOrders,
    disputes,
    documents,
    punchList,
    isLoading,
    createProject,
    updateProjectStatus,
    createScopeOfWork,
    createContract,
    signContract,
    createMilestone,
    updateMilestoneStatus,
    addProgressUpdate,
    createPayment,
    releasePayment,
    createChangeOrder,
    updateChangeOrderStatus,
    fileDispute,
    updateDisputeStatus,
    addPunchListItem,
    updatePunchListItem,
    getProjectById,
    getScopeByProjectId,
    getContractByProjectId,
    getMilestonesByProjectId,
    getProgressUpdatesByProjectId,
    getPaymentsByProjectId,
    getChangeOrdersByProjectId,
    getDisputesByProjectId,
    getPunchListByProjectId,
    getUserProjects,
  }), [
    projects,
    scopes,
    contracts,
    milestones,
    progressUpdates,
    payments,
    changeOrders,
    disputes,
    documents,
    punchList,
    isLoading,
    createProject,
    updateProjectStatus,
    createScopeOfWork,
    createContract,
    signContract,
    createMilestone,
    updateMilestoneStatus,
    addProgressUpdate,
    createPayment,
    releasePayment,
    createChangeOrder,
    updateChangeOrderStatus,
    fileDispute,
    updateDisputeStatus,
    addPunchListItem,
    updatePunchListItem,
    getProjectById,
    getScopeByProjectId,
    getContractByProjectId,
    getMilestonesByProjectId,
    getProgressUpdatesByProjectId,
    getPaymentsByProjectId,
    getChangeOrdersByProjectId,
    getDisputesByProjectId,
    getPunchListByProjectId,
    getUserProjects,
  ]);
});
