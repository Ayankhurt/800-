// Re-export types from App.tsx for easier imports
export type UserRole = 'super_admin' | 'admin' | 'finance_manager' | 'moderator' | 'support_agent';

export type PageType = 
  | 'dashboard' 
  | 'users' 
  | 'manage-admins'
  | 'projects' 
  | 'jobs'
  | 'bids'
  | 'finance' 
  | 'payments'
  | 'transactions'
  | 'escrow' 
  | 'payouts' 
  | 'reports' 
  | 'fraud'
  | 'analytics'
  | 'custom-reports'
  | 'disputes' 
  | 'disputes-management'
  | 'disputes-queue'
  | 'support' 
  | 'tickets' 
  | 'knowledge-base'
  | 'communication'
  | 'messages'
  | 'notifications'
  | 'email-campaigns'
  | 'announcements'
  | 'verification'
  | 'content-library'
  | 'moderation'
  | 'projects-management'
  | 'security'
  | 'access-control'
  | 'audit-logs'
  | 'data-privacy'
  | 'marketing'
  | 'referral-program'
  | 'promotional-tools'
  | 'seo'
  | 'analytics-integration'
  | 'settings';

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}


