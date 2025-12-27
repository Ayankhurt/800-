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
  name: string;
  company: string;
  trade: string;
  location: string;
  rating: number;
  reviewCount: number;
  avatar?: string | null;
  phone: string;
  email: string;
  verified: boolean;
  completedProjects: number;
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
  topRated?: boolean;
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
  notes?: string; // Optional
  createdBy: string; // Added - always set by backend
  submittedAt: string;
  documents: string[];
  proposal?: string;
  timelineDays?: number;
  status?: string;
}
