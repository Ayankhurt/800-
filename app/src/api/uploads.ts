import apiClient from "./client";
import { ApiResponse, UploadResponse } from "./types";

/**
 * File Uploads API
 * 
 * Endpoints:
 * - POST /uploads → upload file (multipart/form-data)
 * 
 * Supports:
 * - Profile pictures
 * - Progress update photos/videos
 * - Portfolio images
 * - Chat file attachments
 * - Dispute evidence
 */

export interface UploadFileData {
  file: any; // File object or URI
  type: 'profile' | 'portfolio' | 'progress' | 'chat' | 'dispute' | 'milestone';
  project_id?: string;
  milestone_id?: string;
  description?: string;
}

const uploadsAPI = {
  /**
   * Upload a file
   * POST /uploads
   * 
   * @param data - File data and metadata
   * @returns Upload response with URL
   */
  upload: async (data: UploadFileData): Promise<ApiResponse<UploadResponse | null>> => {
    try {
      // Create FormData
      const formData = new FormData();

      // Handle file - could be URI (React Native) or File (web)
      if (data.file) {
        // For React Native, file is typically { uri, type, name }
        if (typeof data.file === 'object' && data.file.uri) {
          formData.append('file', {
            uri: data.file.uri,
            type: data.file.type || 'image/jpeg',
            name: data.file.name || 'image.jpg',
          } as any);
        } else {
          // For web, file is a File object
          formData.append('file', data.file);
        }
      }

      formData.append('type', data.type);
      if (data.project_id) formData.append('project_id', data.project_id);
      if (data.milestone_id) formData.append('milestone_id', data.milestone_id);
      if (data.description) formData.append('description', data.description);

      const response = await apiClient.post("/uploads", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Upload file API error:", error);
      if (error.response?.status === 404) {
        return {
          success: false,
          message: "Upload endpoint not available. Please ensure backend has /uploads endpoint configured.",
          data: null
        };
      }
      throw error;
    }
  },

  /**
   * Upload multiple files
   * POST /uploads (with multiple files)
   */
  uploadMultiple: async (files: UploadFileData[]): Promise<ApiResponse<UploadResponse[]>> => {
    try {
      // Upload files sequentially to avoid overwhelming the server
      const results: UploadResponse[] = [];

      for (const fileData of files) {
        try {
          const result = await uploadsAPI.upload(fileData);
          if (result.success && result.data) {
            results.push(result.data);
          }
        } catch (error) {
          console.error(`Failed to upload file:`, error);
          // Continue with other files
        }
      }

      return {
        success: true,
        message: `Uploaded ${results.length} of ${files.length} files`,
        data: results,
      };
    } catch (error: any) {
      console.error("Upload multiple files API error:", error);
      throw error;
    }
  },
};

export default uploadsAPI;




