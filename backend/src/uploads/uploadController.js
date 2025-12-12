// Upload Controller
import { formatResponse } from '../utils/formatResponse.js';
import { supabase } from '../config/supabaseClient.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Configure multer for memory storage (we'll upload to Supabase Storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and documents
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  },
});

// Upload middleware
export const uploadMiddleware = upload.single('file');

/**
 * Upload file to Supabase Storage
 * POST /uploads
 */
export const uploadFile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(formatResponse(false, 'User not authenticated', null));
    }

    if (!req.file) {
      return res.status(400).json(formatResponse(false, 'No file provided', null));
    }

    const { type, project_id, milestone_id, description } = req.body;
    const file = req.file;

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;
    
    // Determine storage bucket based on type
    let bucket = 'uploads';
    if (type === 'profile') bucket = 'profiles';
    else if (type === 'portfolio') bucket = 'portfolios';
    else if (type === 'progress' || type === 'milestone') bucket = 'progress';
    else if (type === 'chat') bucket = 'chat';
    else if (type === 'dispute') bucket = 'disputes';

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json(formatResponse(false, 'Failed to upload file', null));
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // Store file metadata in database (optional - create uploads table if needed)
    // For now, just return the URL

    return res.json(
      formatResponse(true, 'File uploaded successfully', {
        url: fileUrl,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        type: type || 'general',
        project_id: project_id || null,
        milestone_id: milestone_id || null,
      })
    );
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json(formatResponse(false, error.message || 'Upload failed', null));
  }
};




