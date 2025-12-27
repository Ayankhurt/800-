import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  FileText,
  DollarSign,

  Building,
  ArrowRight,
  CheckCircle,
  Loader,
  AlertCircle,
} from "lucide-react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useBids } from "@/contexts/BidsContext";
import { useJobs } from "@/contexts/JobsContext";

const staticColors = {
  primary: "#2563EB",
  secondary: "#F97316",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  textTertiary: "#94A3B8",
  border: "#E2E8F0",
  info: "#3B82F6",
  primaryLight: "#EFF6FF",
};
import { generateProContract } from "@/services/ai/contract-generation";

export default function ProjectSetupScreen() {
  const { bidId, submissionId } = useLocalSearchParams();
  const router = useRouter();
  const { user, colors } = useAuth();
  const { getBidById, getSubmissionsByBidId } = useBids();
  const { getJobById, applications } = useJobs();
  const { createProject, createScopeOfWork, createContract, createMilestone } = useProjects();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [contractNotes, setContractNotes] = useState("");

  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    totalAmount: 0,
    escrowBalance: 0,
    startDate: "",
    endDate: "",
  });

  const [scopeData, setScopeData] = useState<any>(null);
  const [contractData, setContractData] = useState<any>(null);
  const [milestonesData, setMilestonesData] = useState<any[]>([]);

  const bidData = getBidById(bidId as string);
  const jobData = !bidData ? getJobById(bidId as string) : null;

  const source = bidData || jobData;
  const sourceTitle = bidData ? bidData.projectName : (jobData ? jobData.title : "");
  const sourceDescription = bidData ? bidData.description : (jobData ? jobData.description : "");

  const submissions = getSubmissionsByBidId(bidId as string);
  const bidSubmission = submissions.find(s => s.id === submissionId);
  const jobApplication = !bidSubmission ? applications.find(a => a.id === submissionId) : null;

  const submission = bidSubmission || (jobApplication ? {
    id: jobApplication.id,
    contractorId: jobApplication.applicantId,
    contractorName: jobApplication.applicantName,
    amount: parseFloat(jobApplication.proposedRate || "0"),
    notes: jobApplication.coverLetter
  } : null);

  const generateContractAndScope = async () => {
    if (!source || !submission || !user) return;

    setGenerating(true);
    setError("");

    try {
      console.log('Generating contract with AI...');
      const generated = await generateProContract({
        description: `Project: ${sourceTitle}. Description: ${sourceDescription}. Contractor Notes: ${submission.notes}. Owner Notes: ${contractNotes}`,
        amount: submission.amount,
        ownerName: user.fullName,
        contractorName: submission.contractorName,
        state: 'California'
      });

      console.log('Contract generated successfully:', generated);

      setScopeData(generated.scope);
      setContractData(generated.contract);
      setMilestonesData(generated.milestones);

      const totalAmount = submission.amount;
      setProjectData({
        title: sourceTitle,
        description: sourceDescription,
        totalAmount,
        escrowBalance: totalAmount,
        startDate: new Date().toISOString().split("T")[0],
        endDate: generated.milestones[generated.milestones.length - 1]?.dueDate || "",
      });

      setStep(2);
    } catch (err) {
      console.error("Error generating contract:", err);
      setError("Failed to generate contract. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !bid || !submission) return;

    setGenerating(true);
    setError("");

    try {
      const project = await createProject({
        bidId: bid.id,
        ownerId: user.id,
        ownerName: user.fullName,
        contractorId: submission.contractorId,
        contractorName: submission.contractorName,
        title: projectData.title,
        description: projectData.description,
        status: "setup",
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        totalAmount: projectData.totalAmount,
        escrowBalance: projectData.escrowBalance,
      });

      if (!project) throw new Error("Failed to create project");

      await createScopeOfWork({
        projectId: project.id,
        workBreakdown: scopeData.workBreakdown,
        materials: scopeData.materials,
        requirements: scopeData.requirements,
        exclusions: scopeData.exclusions,
        approvedByOwner: true,
        approvedByContractor: false,
      });

      await createContract({
        projectId: project.id,
        contractType: contractData.contractType,
        terms: contractData.terms,
        paymentSchedule: contractData.terms.paymentSchedule,
        warrantyTerms: { description: contractData.terms.warranty },
        disputeResolution: { method: "Mediation then arbitration as per contract" },
        insuranceRequirements: { description: contractData.terms.insurance },
        ownerSigned: false,
        contractorSigned: false,
      });

      for (const milestone of milestonesData) {
        await createMilestone({
          projectId: project.id,
          title: milestone.title,
          description: milestone.description,
          dueDate: milestone.dueDate,
          paymentAmount: milestone.paymentAmount,
          deliverables: milestone.deliverables,
          acceptanceCriteria: milestone.acceptanceCriteria,
          status: "not_started",
          orderNumber: milestone.orderNumber,
        });
      }

      router.push({ pathname: "/project-dashboard", params: { id: project.id } } as any);
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Failed to create project. Please try again.");
      setGenerating(false);
    }
  };

  if (!source || !submission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: "Project Setup", headerShown: true, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Source Not Found</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Unable to load project source information</Text>
        </View>
      </View>
    );
  }

  const bid = source; // For backward compatibility with JSX if any

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Project Setup",
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={styles.progressBar}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive, { backgroundColor: step >= 1 ? colors.primary : colors.border }]}>
            {step > 1 ? (
              <CheckCircle size={16} color={colors.white} />
            ) : (
              <Text style={[styles.progressNumber, { color: step >= 1 ? colors.white : colors.textSecondary }]}>1</Text>
            )}
          </View>
          <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>
            Generate
          </Text>
        </View>

        <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />

        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive, { backgroundColor: step >= 2 ? colors.primary : colors.border }]}>
            {step > 2 ? (
              <CheckCircle size={16} color={colors.white} />
            ) : (
              <Text style={[styles.progressNumber, { color: step >= 2 ? colors.white : colors.textSecondary }]}>2</Text>
            )}
          </View>
          <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>
            Review
          </Text>
        </View>

        <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />

        <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]}>
          <View style={[styles.progressDot, step >= 3 && styles.progressDotActive, { backgroundColor: step >= 3 ? colors.primary : colors.border }]}>
            <Text style={[styles.progressNumber, { color: step >= 3 ? colors.white : colors.textSecondary }]}>3</Text>
          </View>
          <Text style={[styles.progressLabel, step >= 3 && styles.progressLabelActive]}>
            Sign
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={[styles.bidSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.bidTitle, { color: colors.text }]}>{sourceTitle}</Text>
              <Text style={[styles.bidDescription, { color: colors.textSecondary }]}>{sourceDescription}</Text>

              <View style={styles.detailsGrid}>
                <View style={[styles.detailCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <DollarSign size={20} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Bid Amount</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>${submission.amount.toLocaleString()}</Text>
                </View>

                <View style={[styles.detailCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Building size={20} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contractor</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{submission.contractorName}</Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}>
                <FileText size={20} color={colors.primary} />
                <View style={styles.infoCardContent}>
                  <Text style={[styles.infoCardTitle, { color: colors.primary }]}>AI Contract Generation</Text>
                  <Text style={[styles.infoCardText, { color: colors.textSecondary }]}>
                    We will generate a comprehensive contract including:
                  </Text>
                  <View style={styles.featureList}>
                    <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• Detailed scope of work</Text>
                    <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• Payment milestones</Text>
                    <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• California contractor law protections</Text>
                    <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• Timeline & deliverables</Text>
                    <Text style={[styles.featureItem, { color: colors.textSecondary }]}>• Owner & contractor legal safeguards</Text>
                  </View>
                </View>
              </View>

              <View style={styles.notesCard}>
                <Text style={[styles.notesLabel, { color: colors.text }]}>Additional Notes (Optional)</Text>
                <Text style={[styles.notesHelperText, { color: colors.textTertiary }]}>
                  Provide any additional details to help AI create a better contract
                  (e.g., special requirements, specific materials, timeline considerations)
                </Text>
                <TextInput
                  style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter notes here to improve AI-generated contract..."
                  placeholderTextColor={colors.textTertiary}
                  value={contractNotes}
                  onChangeText={setContractNotes}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + "15" }]}>
                <AlertCircle size={20} color={colors.error} />
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, generating && [styles.primaryButtonDisabled, { opacity: 0.5 }]]}
              onPress={generateContractAndScope}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader size={20} color={colors.white} />
                  <Text style={[styles.primaryButtonText, { color: colors.white }]}>Generating Contract...</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.primaryButtonText, { color: colors.white }]}>Generate Contract</Text>
                  <ArrowRight size={20} color={colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && scopeData && contractData && (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Review Generated Contract</Text>

            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewCardTitle, { color: colors.text }]}>Scope of Work</Text>
              <Text style={[styles.reviewCardSubtitle, { color: colors.textSecondary }]}>
                {scopeData.workBreakdown.phases.length} phases • {scopeData.materials.items.length} materials
              </Text>

              <View style={styles.phasesList}>
                {scopeData.workBreakdown.phases.map((phase: any, index: number) => (
                  <View key={index} style={styles.phaseItem}>
                    <View style={[styles.phaseNumber, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.phaseNumberText, { color: colors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.phaseContent}>
                      <Text style={[styles.phaseName, { color: colors.text }]}>{phase.name}</Text>
                      <Text style={[styles.phaseTimeline, { color: colors.textSecondary }]}>{phase.timeline}</Text>
                      <Text style={[styles.phaseTasks, { color: colors.textSecondary }]}>{phase.tasks.length} tasks</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewCardTitle, { color: colors.text }]}>Payment Schedule</Text>
              <Text style={[styles.reviewCardSubtitle, { color: colors.textSecondary }]}>
                {contractData.terms.paymentSchedule.length} milestone payments
              </Text>

              {contractData.terms.paymentSchedule.map((payment: any, index: number) => (
                <View key={index} style={[styles.paymentItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentMilestone, { color: colors.text }]}>{payment.milestone}</Text>
                    <Text style={[styles.paymentDue, { color: colors.textSecondary }]}>{payment.dueDate}</Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={[styles.paymentPercentage, { color: colors.success }]}>{payment.percentage}%</Text>
                    <Text style={[styles.paymentValue, { color: colors.text }]}>${payment.amount.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewCardTitle, { color: colors.text }]}>Contract Terms</Text>
              <View style={styles.termsList}>
                <View style={styles.termItem}>
                  <Text style={[styles.termLabel, { color: colors.textSecondary }]}>Warranty:</Text>
                  <Text style={[styles.termValue, { color: colors.text }]}>{contractData.terms.warranty}</Text>
                </View>
                <View style={styles.termItem}>
                  <Text style={[styles.termLabel, { color: colors.textSecondary }]}>Insurance:</Text>
                  <Text style={[styles.termValue, { color: colors.text }]}>{contractData.terms.insurance}</Text>
                </View>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + "15" }]}>
                <AlertCircle size={20} color={colors.error} />
                <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => setStep(1)}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Regenerate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, backgroundColor: colors.primary }, generating && [styles.primaryButtonDisabled, { opacity: 0.5 }]]}
                onPress={handleCreateProject}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader size={20} color={colors.white} />
                    <Text style={[styles.primaryButtonText, { color: colors.white }]}>Creating...</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.primaryButtonText, { color: colors.white }]}>Create Project</Text>
                    <ArrowRight size={20} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  progressBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: staticColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  progressStep: {
    alignItems: "center" as const,
    gap: 8,
  },
  progressStepActive: {},
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: staticColors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  progressDotActive: {
    backgroundColor: staticColors.primary,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: staticColors.textSecondary,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: staticColors.textTertiary,
  },
  progressLabelActive: {
    color: staticColors.primary,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: staticColors.border,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: staticColors.primary,
  },
  stepContainer: {
    gap: 20,
  },
  bidSummary: {
    gap: 16,
  },
  bidTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  bidDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: staticColors.textSecondary,
  },
  detailsGrid: {
    flexDirection: "row" as const,
    gap: 12,
  },
  detailCard: {
    flex: 1,
    backgroundColor: staticColors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: staticColors.textTertiary,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  infoCard: {
    flexDirection: "row" as const,
    gap: 16,
    backgroundColor: staticColors.primary + "10",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.primary + "30",
  },
  infoCardContent: {
    flex: 1,
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  infoCardText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  featureList: {
    marginTop: 8,
    gap: 4,
  },
  featureItem: {
    fontSize: 14,
    color: staticColors.text,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: staticColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: staticColors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  reviewCard: {
    backgroundColor: staticColors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    gap: 16,
  },
  reviewCardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  reviewCardSubtitle: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  phasesList: {
    gap: 12,
  },
  phaseItem: {
    flexDirection: "row" as const,
    gap: 12,
    padding: 12,
    backgroundColor: staticColors.background,
    borderRadius: 8,
  },
  phaseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: staticColors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  phaseNumberText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: staticColors.white,
  },
  phaseContent: {
    flex: 1,
    gap: 4,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
  },
  phaseTimeline: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  phaseTasks: {
    fontSize: 12,
    color: staticColors.textTertiary,
  },
  paymentItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMilestone: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: staticColors.text,
    marginBottom: 4,
  },
  paymentDue: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  paymentAmount: {
    alignItems: "flex-end" as const,
  },
  paymentPercentage: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: staticColors.primary,
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  termsList: {
    gap: 12,
  },
  termItem: {
    gap: 4,
  },
  termLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: staticColors.textSecondary,
  },
  termValue: {
    fontSize: 14,
    color: staticColors.text,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  errorBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    backgroundColor: staticColors.error + "10",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.error + "30",
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: staticColors.error,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  errorText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: "center" as const,
  },
  notesCard: {
    backgroundColor: staticColors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    gap: 12,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: staticColors.text,
  },
  notesHelperText: {
    fontSize: 13,
    color: staticColors.textSecondary,
    lineHeight: 18,
  },
  notesInput: {
    backgroundColor: staticColors.background,
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: staticColors.text,
    minHeight: 120,
  },
});
