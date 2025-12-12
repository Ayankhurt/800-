import express from 'express';
import { authenticateUser, requireAdmin } from '../middlewares/auth.js';
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

const router = express.Router();

// Get all transactions
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const { data, count, error } = await supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return res.json(formatResponse(true, 'Transactions retrieved', {
            transactions: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
});

// Create transaction
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { project_id, milestone_id, payee_id, amount, type } = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                project_id,
                milestone_id,
                payer_id: userId,
                payee_id,
                amount,
                type,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, 'Transaction created', data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
});

// Get transaction stats
router.get('/stats', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('transactions')
            .select('amount, type, status')
            .or(`payer_id.eq.${userId},payee_id.eq.${userId}`);

        if (error) throw error;

        const stats = {
            total_sent: data.filter(t => t.payer_id === userId).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            total_received: data.filter(t => t.payee_id === userId).reduce((sum, t) => sum + parseFloat(t.amount), 0),
            pending: data.filter(t => t.status === 'pending').length,
            completed: data.filter(t => t.status === 'completed').length
        };

        return res.json(formatResponse(true, 'Transaction stats retrieved', stats));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
});

// Get single transaction
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json(formatResponse(false, 'Transaction not found', null));

        return res.json(formatResponse(true, 'Transaction retrieved', data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
});

// Update transaction status
router.put('/:id/status', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('transactions')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, 'Transaction status updated', data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
});

// Refund transaction
router.post('/:id/refund', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get original transaction
        const { data: transaction, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        if (!transaction) return res.status(404).json(formatResponse(false, 'Transaction not found', null));

        // Create refund transaction
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                project_id: transaction.project_id,
                payer_id: transaction.payee_id,
                payee_id: transaction.payer_id,
                amount: transaction.amount,
                type: 'refund',
                status: 'completed',
                meta: { original_transaction_id: id, reason }
            })
            .select()
            .single();

        if (error) throw error;

        // Update original transaction
        await supabase
            .from('transactions')
            .update({ status: 'refunded' })
            .eq('id', id);

        return res.json(formatResponse(true, 'Transaction refunded', data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
});

export default router;
