import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Configure multer for disk storage for better reliability with large files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/temp';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log(`[MULTER DEBUG] Incoming file: ${file.originalname}, mimetype: ${file.mimetype}`);

        // Allow images, documents and videos
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/heic',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4',
            'video/quicktime',
            'video/mov',
            'video/avi',
            'video/x-msvideo',
            'video/mpeg',
            'application/octet-stream' // Often used by mobile devices when mimetype is unclear
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.warn(`[MULTER DEBUG] File rejected: ${file.mimetype}`);
            cb(new Error(`Invalid file type: ${file.mimetype}. Only images, documents and videos allowed.`));
        }
    }
});

// Upload intro video
export const uploadIntroVideo = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        console.log(`[Backend DEBUG] uploadIntroVideo request entry`);
        console.log(`[Backend DEBUG] Headers: ${JSON.stringify(req.headers)}`);
        console.log(`[Backend DEBUG] Body keys: ${Object.keys(req.body || {})}`);

        if (file) {
            console.log(`[Backend DEBUG] File found: ${file.originalname}, field: ${file.fieldname}, mimetype: ${file.mimetype}`);
        } else {
            console.log(`[Backend DEBUG] NO FILE FOUND in req.file`);
        }

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file found in request. Ensure field name is "file" and Content-Type is multipart/form-data with boundary.'));
        }

        const ext = file.originalname.split('.').pop();
        const filename = `${userId}/intro-video.${ext}`;

        console.log(`[Backend DEBUG] Starting Storage upload for ${filename}`);
        const fileContent = fs.readFileSync(file.path);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('intro-videos')
            .upload(filename, fileContent, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: true
            });

        // Delete temp file from disk
        try { fs.unlinkSync(file.path); } catch (e) { console.error('Error deleting temp file:', e); }

        if (error) {
            console.error(`[Backend DEBUG] Storage upload FAILED: ${error.message}`);
            throw error;
        }
        console.log(`[Backend DEBUG] Storage upload SUCCESS`);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('intro-videos')
            .getPublicUrl(filename);

        console.log(`[Backend DEBUG] Updating user profile with video URL`);

        // Update user profile
        await supabase
            .from('users')
            .update({ intro_video_url: publicUrl })
            .eq('id', userId);

        return res.status(201).json(formatResponse(true, 'Intro video uploaded', {
            url: publicUrl
        }));
    } catch (err) {
        console.error('Upload intro video error:', err);
        return res.status(500).json(formatResponse(false, err.message));
    }
};

// Upload portfolio image
export const uploadPortfolioImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file uploaded'));
        }

        const fileContent = fs.readFileSync(file.path);

        // Compress image
        const compressedImage = await sharp(fileContent)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

        // Generate thumbnail
        const thumbnail = await sharp(fileContent)
            .resize(400, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Delete temp file
        try { fs.unlinkSync(file.path); } catch (e) { console.error('Error deleting temp file:', e); }

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

        const fileContent = fs.readFileSync(file.path);

        // Compress image
        const compressedImage = await sharp(fileContent)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Delete temp file
        try { fs.unlinkSync(file.path); } catch (e) { console.error('Error deleting temp file:', e); }

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
        const fileContent = fs.readFileSync(file.path);

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filename, fileContent, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        // Delete temp file from disk
        try { fs.unlinkSync(file.path); } catch (e) { console.error('Error deleting temp file:', e); }

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

        console.log(`[Backend DEBUG] uploadAvatar request entry`);
        console.log(`[Backend DEBUG] Headers: ${JSON.stringify(req.headers)}`);
        console.log(`[Backend DEBUG] Body keys: ${Object.keys(req.body || {})}`);

        if (file) {
            console.log(`[Backend DEBUG] File found: ${file.originalname}, field: ${file.fieldname}, mimetype: ${file.mimetype}`);
        } else {
            console.log(`[Backend DEBUG] NO FILE FOUND in req.file`);
        }

        if (!file) {
            return res.status(400).json(formatResponse(false, 'No file found in request. Ensure field name is "file" and Content-Type is multipart/form-data with boundary.'));
        }

        // Compress and resize avatar
        const fileContent = fs.readFileSync(file.path);
        const avatar = await sharp(fileContent)
            .resize(400, 400, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toBuffer();

        // Delete temp file
        try { fs.unlinkSync(file.path); } catch (e) { console.error('Error deleting temp file:', e); }

        const filename = `${userId}/avatar.jpg`;

        console.log(`[Backend DEBUG] Starting Avatar storage upload: ${filename}`);
        // Upload to Supabase Storage (overwrite existing)
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filename, avatar, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true // Overwrite existing avatar
            });

        if (error) {
            console.error(`[Backend DEBUG] Avatar storage FAILED: ${error.message}`);
            throw error;
        }
        console.log(`[Backend DEBUG] Avatar storage SUCCESS`);

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
        const fileContent = fs.readFileSync(file.path);

        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(filename, fileContent, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        // Delete temp file from disk
        try { fs.unlinkSync(file.path); } catch (e) { console.error('Error deleting temp file:', e); }

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
