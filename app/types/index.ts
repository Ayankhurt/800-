export type UserRole =
  | "Admin"
  | "GC"
  | "Subcontractor"
  | "Trade Specialist"
  | "Project Manager"
  | "Viewer";

export type VerificationType = "identity" | "license" | "insurance" | "background" | "references" | "payment";

export interface Verification {
  type: VerificationType;
  verified: boolean;
  verifiedAt?: string;
  expiresAt?: string;
  documentUrl?: string;
}

export interface TrustIndicators {
  responseTime: number;
  responseRate: number;
  onTimeRate: number;
  repeatClientRate: number;
  disputeRate: number;
}

export interface PortfolioItem {
  id: string;
  projectName: string;
  description: string;
  location: string;
  completedDate: string;
  images: string[];
  budget?: string;
  category: string;
}

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  rating: number;
  date: string;
  projectType: string;
  comment: string;
  helpful: number;
  response?: {
    message: string;
    date: string;
  };
}

export interface Endorsement {
  id: string;
  fromId: string;
  fromName: string;
  fromCompany: string;
  skill: string;
  relationship: "client" | "colleague" | "supervisor" | "subcontractor";
  comment: string;
  date: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verificationUrl?: string;
}

export interface Award {
  id: string;
  title: string;
  organization: string;
  year: string;
  description: string;
}

export interface ExperienceEntry {
  id: string;
  year: string;
  title: string;
  description: string;
  type: "milestone" | "project" | "certification" | "award";
}

export interface BeforeAfter {
  id: string;
  projectName: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  completionDate: string;
  category: string;
}

export interface Contractor {
  id: string;
  name?: string;
  full_name?: string;
  fullName?: string;
  company?: string;
  company_name?: string;
  companyName?: string;
  trade?: string;
  trade_type?: string;
  tradeType?: string;
  location?: string;
  address?: string;
  rating?: number;
  average_rating?: number;
  averageRating?: number;
  reviewCount?: number;
  review_count?: number;
  avatar?: string | null;
  phone?: string;
  email?: string;
  verified?: boolean;
  is_verified?: boolean;
  isVerified?: boolean;
  completedProjects?: number;
  completed_projects?: number;
  verifications?: Verification[];
  trustIndicators?: TrustIndicators;
  yearsInBusiness?: number;
  insuranceAmount?: string;
  licenseNumber?: string;
  specialties?: string[];
  portfolio?: PortfolioItem[];
  reviews?: Review[];
  endorsements?: Endorsement[];
  certifications?: Certification[];
  awards?: Award[];
  experienceTimeline?: ExperienceEntry[];
  beforeAfterProjects?: BeforeAfter[];
  featured?: boolean;
  is_featured?: boolean;
  isFeatured?: boolean;
  topRated?: boolean;
  top_rated?: boolean;
  isTopRated?: boolean;
  availability?: {
    calendar: { date: string; available: boolean }[];
    nextAvailable?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type BidStatus = "pending" | "submitted" | "awarded" | "declined";

export interface Bid {
  id: string;
  projectName: string;
  description: string;
  dueDate: string;
  status: BidStatus;
  budget?: string;
  contractorCount: number;
  submittedCount: number;
  createdAt: string;
  projectManagerId?: string;
  jobId?: string;
}

export interface BidSubmission {
  id: string;
  bidId: string;
  contractorId: string;
  contractorName: string;
  contractorCompany: string;
  amount: number;
  notes?: string;
  createdBy: string;
  submittedAt: string;
  documents?: string[];
  proposal?: string;
  timelineDays?: number;
  status?: string;
}

export type JobUrgency = "low" | "medium" | "high" | "urgent";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface Appointment {
  id: string;
  title: string;
  contractorId: string;
  contractorName: string;
  contractorCompany: string;
  date: string;
  time: string;
  location: string;
  type: "estimate" | "site_visit" | "meeting" | "consultation";
  status: "scheduled" | "completed" | "cancelled" | "no_show" | "pending";
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  confirmedAt?: string;
  jobId?: string;
  requestedBy?: string;
  applicationId?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  trade?: string;
  location?: string;
  status: string;
  urgency: JobUrgency;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  budget?: string | number;
  category?: string;
  postedBy?: string;
  postedByName?: string;
  postedByCompany?: string;
  startDate?: string;
  endDate?: string;
  payRate?: string;
  requirements: string[]; // Force string[] for consistency
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantId: string;
  applicantName: string;
  applicantCompany?: string;
  applicantRole?: string;
  applicantPhone?: string; // Added for job-details.tsx
  applicantEmail?: string; // Add for compatibility with mocks
  status: ApplicationStatus;
  appliedAt: string;
  respondedAt?: string;
  responseNote?: string;
  coverLetter?: string;
  proposedBudget?: number;
  proposedRate?: string; // Change back to string for consistency with parseFloat
  proposedStartDate?: string;
  availableFrom?: string; // Added for job-details.tsx
  documents?: string[];
}

export interface JobMessage {
  id: string;
  jobId: string;
  applicationId?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  sentAt: string;
  read: boolean;
}

export interface JobNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
  jobId?: string; // Add for compatibility
  applicationId?: string;
  appointmentId?: string;
}

export type ProjectStatus = "active" | "completed" | "on_hold" | "cancelled" | "setup";

export interface Project {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName?: string;
  contractorId: string;
  contractorName?: string;
  status: ProjectStatus;
  completionPercentage: number;
  paidAmount: number;
  totalAmount: number;
  escrowBalance: number;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  location?: string;
  bidId?: string;
}

export interface ScopeOfWork {
  id: string;
  projectId: string;
  content?: string;
  version: number; // Put back for compatibility
  workBreakdown?: {
    phases: any[];
  };
  materials?: {
    items: any[];
  };
  requirements?: string[];
  exclusions?: string[];
  approvedByOwner?: boolean;
  approvedByContractor?: boolean;
  lastUpdated?: string;
  createdAt: string;
}

export interface ProjectContract {
  id: string;
  projectId: string;
  terms: string;
  ownerSigned: boolean;
  ownerSignature?: string;
  ownerSignedAt?: string;
  contractorSigned: boolean;
  contractorSignature?: string;
  contractorSignedAt?: string;
  fullyExecutedAt?: string;
  createdAt: string;
  contractType?: string;
  paymentSchedule?: any[]; // Changed to any[] for map
  insuranceRequirements?: { description: string };
  warrantyTerms?: { description: string };
  disputeResolution?: { method: string };
}

export type MilestoneStatus = "pending" | "in_progress" | "review_requested" | "approved" | "completed" | "not_started" | "pending_review" | "needs_revision";

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  paymentAmount: number;
  dueDate: string;
  orderNumber: number;
  status: MilestoneStatus;
  deliverables?: string[];
  acceptanceCriteria?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  revisionCount: number;
}

export interface ProgressUpdate {
  id: string;
  projectId: string;
  milestoneId?: string;
  content: string;
  images?: string[];
  createdAt: string;
  createdBy: string;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  milestoneId?: string;
  amount: number;
  type: "milestone" | "deposit" | "final" | "change_order";
  status: "pending" | "held_in_escrow" | "completed" | "failed";
  escrowHeld: boolean;
  releasedAt?: string;
  createdAt: string;
}

export type ChangeOrderStatus = "requested" | "approved" | "declined" | "implemented";

export interface ChangeOrder {
  id: string;
  projectId: string;
  title: string;
  description: string;
  costImpact: number;
  timeImpactDays: number;
  status: ChangeOrderStatus;
  requestedBy: string;
  approvedAt?: string;
  createdAt: string;
}

export type DisputeType = "quality" | "timeline" | "payment" | "communication" | "other" | "platform" | "professional" | "legal" | "financial";
export type DisputeStatus = "filed" | "under_review" | "in_mediation" | "resolved" | "closed" | "pending_review";

export interface Dispute {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: DisputeType;
  disputeType: DisputeType; // Duplicate for compatibility
  status: DisputeStatus;
  filedBy: string;
  filedAgainst: string;
  filedByName?: string;
  amount?: number;
  amountDisputed?: number; // Duplicate for compatibility
  desiredResolution?: string;
  evidence?: {
    photos: string[];
    documents: string[];
    messages: string[];
  } | any;
  resolutionStage: "internal" | "platform" | "professional" | "legal" | "mediation" | "arbitration";
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface MilestoneApproval {
  id: string;
  milestoneId: string;
  approvedBy: string;
  notes?: string;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  createdAt: string;
}

export interface PunchListItem {
  id: string;
  projectId: string;
  description: string;
  location?: string;
  priority?: "low" | "medium" | "high";
  photos?: string[];
  status: "pending" | "completed";
  completedAt?: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  userId?: string;
  name: string;
  content: string;
  category: string;
}

export interface Quote {
  id: string;
  bidId?: string;
  jobId?: string;
  contractorId: string;
  senderId?: string;
  receiverId?: string;
  contractorName: string;
  senderName?: string;
  amount: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  title?: string;
  description?: string;
  items: QuoteLineItem[];
  lineItems?: QuoteLineItem[]; // Add for compatibility
  status: "pending" | "accepted" | "declined" | "sent";
  validUntil?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  total?: number; // Add for compatibility
}

export interface SavedContractor {
  id: string;
  userId: string;
  contractorId: string;
  notes?: string;
  savedAt: string;
  createdAt: string;
}

export interface VideoConsultation {
  id: string;
  jobId?: string;
  projectId?: string;
  contractorId: string;
  contractorName?: string;
  requestedBy: string;
  requestedByName?: string;
  participants?: string[];
  startTime?: string;
  endTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  duration?: number;
  topic?: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  meetingUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EstimateRequest {
  id: string;
  jobId: string;
  applicationId?: string;
  requestedBy: string;
  requestedFrom: string;
  requestedFromName: string;
  location: string;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
  status: "pending" | "accepted" | "declined" | "confirmed";
  appointmentId?: string;
  requestedByName?: string;
  createdAt: string;
  updatedAt: string;
}
