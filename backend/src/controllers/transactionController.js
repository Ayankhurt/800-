import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Create transaction (deposit to escrow)
export const createTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id, amount, type, payment_method } = req.body;

        if (!project_id || !amount || !type) {
            return res.status(400).json(formatResponse(false, "Project ID, amount, and type required", null));
        }

        const { data, error } = await supabase
            .from("transactions")
            .insert({
                project_id,
                user_id: userId,
                amount,
                type, // deposit, payment, refund, payout
                payment_method: payment_method || 'card',
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Transaction created", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get all transactions
export const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { project_id, type, status, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;


        let query = supabase
            .from("transactions")
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        // Non-admin users only see their own transactions
        if (role !== 'admin') {
            query = query.eq("user_id", userId);
        }

        if (project_id) query = query.eq("project_id", project_id);
        if (type) query = query.eq("type", type);
        if (status) query = query.eq("status", status);

        const { data, count, error } = await query;

        if (error) throw error;

        // Manual embedding since DB relationships might be missing
        // This fixes the "Could not find a relationship" error
        let enrichedData = data;
        if (data && data.length > 0) {
            const projectIds = [...new Set(data.map(t => t.project_id).filter(Boolean))];
            const userIds = [...new Set(data.map(t => t.user_id).filter(Boolean))]; // assuming user_id exists

            let projects = [];
            let users = [];

            if (projectIds.length > 0) {
                const { data: p } = await supabase.from('projects').select('id, title').in('id', projectIds);
                projects = p || [];
            }
            if (userIds.length > 0) {
                const { data: u } = await supabase.from('users').select('id, first_name, last_name, email').in('id', userIds);
                users = u || [];
            }

            const projectMap = projects.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

            enrichedData = data.map(t => ({
                ...t,
                project: projectMap[t.project_id] || null,
                user: userMap[t.user_id] || null
            }));
        }

        return res.json(formatResponse(true, "Transactions retrieved", {
            transactions: enrichedData,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));

    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get transaction by ID
export const getTransactionById = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { id } = req.params;


        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json(formatResponse(false, "Transaction not found", null));
        }

        // Manual embedding
        if (data.project_id) {
            const { data: project } = await supabase.from('projects').select('*').eq('id', data.project_id).single();
            data.project = project || null;
        }
        if (data.user_id) {
            const { data: user } = await supabase.from('users').select('id, first_name, last_name, email').eq('id', data.user_id).single();
            data.user = user || null;
        }

        // Check access
        if (role !== 'admin' && data.user_id !== userId) {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        return res.json(formatResponse(true, "Transaction details retrieved", data));

    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update transaction status (admin only)
export const updateTransactionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
            return res.status(400).json(formatResponse(false, "Invalid status", null));
        }

        const { data, error } = await supabase
            .from("transactions")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Transaction status updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Process refund (admin only)
export const processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const { data: transaction } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", id)
            .single();

        if (!transaction) {
            return res.status(404).json(formatResponse(false, "Transaction not found", null));
        }

        if (transaction.status === 'refunded') {
            return res.status(400).json(formatResponse(false, "Transaction already refunded", null));
        }

        // Create refund transaction
        const { data: refund, error } = await supabase
            .from("transactions")
            .insert({
                project_id: transaction.project_id,
                user_id: transaction.user_id,
                amount: transaction.amount,
                type: 'refund',
                status: 'completed',
                reference_transaction_id: id,
                notes: reason
            })
            .select()
            .single();

        if (error) throw error;

        // Update original transaction
        await supabase
            .from("transactions")
            .update({ status: 'refunded' })
            .eq("id", id);

        return res.json(formatResponse(true, "Refund processed", refund));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get payment statistics
export const getPaymentStats = async (req, res) => {
    try {
        const { data, error } = await supabase
            .rpc('get_payment_stats');

        if (error) throw error;

        return res.json(formatResponse(true, "Payment statistics retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
