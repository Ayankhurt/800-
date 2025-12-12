/**
 * Shared API Types and Interfaces
 */

export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role_code: string;
  account_type: 'APP_USER' | 'ADMIN_USER';
  token?: string;
  access_token?: string;
  refresh_token?: string;
  avatar_url?: string;
  status?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category?: string;
  budget?: number;
  location?: string;
  experience_level?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  job_id: string;
  contractor_id: string;
  amount: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Contractor {
  id: string;
  user_id: string;
  company_name?: string;
  trade?: string;
  rating?: number;
  verified: boolean;
  licensed: boolean;
  insured: boolean;
  portfolio?: any[];
  reviews?: Review[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  amount?: number;
  status: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  status: string;
  type: 'deposit' | 'milestone' | 'final';
  created_at: string;
  updated_at: string;
}

export interface Dispute {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  contractor_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: Message;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}




