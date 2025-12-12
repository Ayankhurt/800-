import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// ==========================================
// TRANSACTIONS
// ==========================================

export const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { data, count, error } = await supabase
            .from("transactions")
            .select("*", { count: "exact" })
            .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return res.json(formatResponse(true, "Transactions retrieved", { transactions: data, total: count }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const createTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id, milestone_id, payee_id, amount, type, payment_processor, processor_payment_id } = req.body;

        const { data, error } = await supabase
            .from("transactions")
            .insert({
                project_id,
                milestone_id,
                payer_id: userId,
                payee_id,
                amount,
                type: type || 'payment',
                status: 'completed',
                payment_processor,
                processor_payment_id,
                platform_fee: amount * 0.05, // Example 5% fee
                processor_fee: amount * 0.029 + 0.30 // Example Stripe fee
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Transaction created", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==========================================
// PAYOUTS
// ==========================================

export const getPayouts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabase
            .from("payouts")
            .select("*")
            .eq("contractor_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Payouts retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const requestPayout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, project_id } = req.body;

        // Check balance logic would go here (omitted for simplicity)

        const { data, error } = await supabase
            .from("payouts")
            .insert({
                contractor_id: userId,
                project_id,
                amount,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Payout requested", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==========================================
// ESCROW
// ==========================================

export const getEscrowDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id } = req.params;

        // Verify access
        const { data: project } = await supabase.from("projects").select("owner_id, contractor_id").eq("id", project_id).single();
        if (!project) return res.status(404).json(formatResponse(false, "Project not found", null));

        if (project.owner_id !== userId && project.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        const { data, error } = await supabase
            .from("escrow_accounts")
            .select("*")
            .eq("project_id", project_id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore not found error

        return res.json(formatResponse(true, "Escrow details retrieved", data || { status: 'not_funded' }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
