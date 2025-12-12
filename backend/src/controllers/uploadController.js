import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and documents
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and documents allowed.'));
        }
    }
});

// Upload portfolio image
export const uploadPortfolioImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file uploaded'));
        }

        // Compress image
        const compressedImage = await sharp(file.buffer)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Generate thumbnail
        const thumbnail = await sharp(file.buffer)
            .resize(400, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        const filename = `${userId}/${uuidv4()}.jpg`;
        const thumbnailFilename = `${userId}/thumbnails/${uuidv4()}.jpg`;

        // Upload to Supabase Storage
        const { data: imageData, error: imageError } = await supabase.storage
            .from('portfolios')
            .upload(filename, compressedImage, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (imageError) throw imageError;

        // Upload thumbnail
        const { data: thumbData, error: thumbError } = await supabase.storage
            .from('portfolios')
            .upload(thumbnailFilename, thumbnail, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (thumbError) throw thumbError;

        // Get public URLs
        const { data: { publicUrl } } = supabase.storage
            .from('portfolios')
            .getPublicUrl(filename);

        const { data: { publicUrl: thumbnailUrl } } = supabase.storage
            .from('portfolios')
            .getPublicUrl(thumbnailFilename);

        return res.status(201).json(formatResponse(true, 'Image uploaded successfully', {
            url: publicUrl,
            thumbnailUrl,
            filename,
            size: compressedImage.length
        }));
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Upload progress photo
export const uploadProgressPhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId, milestoneId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file uploaded'));
        }

        if (!projectId) {
            return res.status(400).json(formatResponse(false, 'Project ID required'));
        }

        // Verify user is part of project
        const { data: project } = await supabase
            .from('projects')
            .select('owner_id, contractor_id')
            .eq('id', projectId)
            .single();

        if (!project || (project.owner_id !== userId && project.contractor_id !== userId)) {
            return res.status(403).json(formatResponse(false, 'Access denied'));
        }

        // Compress image
        const compressedImage = await sharp(file.buffer)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

        const filename = `${projectId}/${milestoneId || 'general'}/${uuidv4()}.jpg`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('progress-photos')
            .upload(filename, compressedImage, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('progress-photos')
            .getPublicUrl(filename);

        return res.status(201).json(formatResponse(true, 'Progress photo uploaded', {
            url: publicUrl,
            filename,
            projectId,
            milestoneId
        }));
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Upload document
export const uploadDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { documentType } = req.body; // 'license', 'insurance', 'contract', etc.
        const file = req.file;

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file uploaded'));
        }

        const ext = file.originalname.split('.').pop();
        const filename = `${userId}/${documentType}/${uuidv4()}.${ext}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filename);

        return res.status(201).json(formatResponse(true, 'Document uploaded', {
            url: publicUrl,
            filename,
            documentType,
            originalName: file.originalname
        }));
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file uploaded'));
        }

        // Compress and resize avatar
        const avatar = await sharp(file.buffer)
            .resize(400, 400, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toBuffer();

        const filename = `${userId}/avatar.jpg`;

        // Upload to Supabase Storage (overwrite existing)
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filename, avatar, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true // Overwrite existing avatar
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filename);

        // Update user profile
        await supabase
            .from('users')
            .update({ avatar_url: publicUrl })
            .eq('id', userId);

        return res.status(201).json(formatResponse(true, 'Avatar uploaded', {
            url: publicUrl
        }));
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Upload chat attachment
export const uploadChatAttachment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file uploaded'));
        }

        if (!conversationId) {
            return res.status(400).json(formatResponse(false, 'Conversation ID required'));
        }

        const ext = file.originalname.split('.').pop();
        const filename = `${conversationId}/${uuidv4()}.${ext}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filename);

        return res.status(201).json(formatResponse(true, 'File uploaded', {
            url: publicUrl,
            filename,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
        }));
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Delete file
export const deleteFile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bucket, filename } = req.params;

        // Verify user owns the file (filename should start with userId)
        if (!filename.startsWith(userId)) {
            return res.status(403).json(formatResponse(false, 'Access denied'));
        }

        const { error } = await supabase.storage
            .from(bucket)
            .remove([filename]);

        if (error) throw error;

        return res.json(formatResponse(true, 'File deleted'));
    } catch (err) {
        console.error('Delete error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

export { upload };
