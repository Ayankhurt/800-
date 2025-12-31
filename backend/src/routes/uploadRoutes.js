import express from 'express';
import {
    uploadPortfolioImage,
    uploadProgressPhoto,
    uploadDocument,
    uploadAvatar,
    uploadChatAttachment,
    uploadIntroVideo,
    deleteFile,
    upload
} from '../controllers/uploadController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// Upload endpoints
router.post('/portfolio', upload.single('file'), uploadPortfolioImage);
router.post('/progress', upload.single('file'), uploadProgressPhoto);
router.post('/document', upload.single('file'), uploadDocument);
router.post('/avatar', upload.single('file'), uploadAvatar);
router.post('/chat', upload.single('file'), uploadChatAttachment);
router.post('/intro-video', upload.single('file'), uploadIntroVideo);

// Delete endpoint
router.delete('/:bucket/:filename', deleteFile);

export default router;
