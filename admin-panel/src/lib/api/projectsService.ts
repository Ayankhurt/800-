import apiClient from './axios';

// Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget?: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
  client?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface Bid {
  id: string;
  job_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  contractor?: {
    id: string;
    full_name: string;
  };
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export const projectsService = {
  // Get all projects
  getAllProjects: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Project[]; total?: number }> => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  // Get project by ID
  getProjectById: async (id: string): Promise<{ success: boolean; data: Project }> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  // Get bids for a job/project
  getBids: async (params?: {
    jobId?: string;
    sort?: 'priceAsc' | 'priceDesc' | 'timeAsc' | 'timeDesc';
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Bid[]; total?: number }> => {
    const response = await apiClient.get('/bids', { params });
    return response.data;
  },

  // Get project milestones
  getProjectMilestones: async (projectId: string): Promise<{ success: boolean; data: Milestone[] }> => {
    const response = await apiClient.get(`/projects/${projectId}/milestones`);
    return response.data;
  },

  // Submit milestone
  submitMilestone: async (milestoneId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/milestones/${milestoneId}/submit`);
    return response.data;
  },

  // Approve milestone
  approveMilestone: async (milestoneId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/milestones/${milestoneId}/approve`);
    return response.data;
  },
};

