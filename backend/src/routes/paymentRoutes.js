import express from 'express';
import {
    createConnectAccount,
    getConnectAccountStatus,
    createAccountLink,
    depositToEscrow,
    releaseEscrow,
    handleWebhook,
    getEscrowTransactions,
    getAllPayments
} from '../controllers/paymentController.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

// Webhook (no auth - Stripe signature verification)
router.post('/webhook', handleWebhook);


// All other routes require authentication
router.use(authenticateUser);

// Stripe Connect
router.post('/stripe/connect', createConnectAccount);
router.get('/stripe/connect/status', getConnectAccountStatus);
router.post('/stripe/connect/link', createAccountLink);

// Escrow
router.post('/projects/:projectId/escrow/deposit', depositToEscrow);
router.post('/projects/:projectId/escrow/release', releaseEscrow);
router.get('/projects/:projectId/escrow', getEscrowTransactions);

// Get All Payments
router.get('/', getAllPayments);

export default router;
