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
  | 'settings';

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

