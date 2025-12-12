// Upload Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import { uploadMiddleware, uploadFile } from './uploadController.js';

const router = express.Router();

// Upload file - All authenticated users can upload
router.post('/', auth, uploadMiddleware, uploadFile);

export default router;




