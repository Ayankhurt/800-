import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Create quote
export const createQuote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { client_id, project_title, items, total_amount, valid_until, notes } = req.body;

        if (!client_id || !items || !total_amount) {
            return res.status(400).json(formatResponse(false, "Client, items, and total amount required", null));
        }

        const { data, error } = await supabase
            .from("quotes")
            .insert({
                contractor_id: userId,
                client_id,
                project_title,
                items,
                total_amount,
                valid_until,
                notes,
                status: 'draft'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Quote created", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get quotes
export const getQuotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, role } = req.query; // role: 'contractor' or 'client'

        let query = supabase
            .from("quotes")
            .select(`
        *,
        contractor:users!fk_quotes_contractor_id (id, first_name, last_name, company_name),
        client:users!fk_quotes_client_id (id, first_name, last_name)
      `)
            .order("created_at", { ascending: false });

        if (role === 'client') {
            query = query.eq("client_id", userId);
        } else {
            query = query.eq("contractor_id", userId);
        }

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Quotes retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update quote status (send/accept/reject)
export const updateQuoteStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!['sent', 'accepted', 'rejected', 'expired'].includes(status)) {
            return res.status(400).json(formatResponse(false, "Invalid status", null));
        }

        // Verify access
        const { data: quote } = await supabase
            .from("quotes")
            .select("*")
            .eq("id", id)
            .single();

        if (!quote) {
            return res.status(404).json(formatResponse(false, "Quote not found", null));
        }

        // Only contractor can send, only client can accept/reject
        if (status === 'sent' && quote.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, "Only contractor can send quote", null));
        }
        if (['accepted', 'rejected'].includes(status) && quote.client_id !== userId) {
            return res.status(403).json(formatResponse(false, "Only client can accept/reject quote", null));
        }

        const { data, error } = await supabase
            .from("quotes")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, `Quote ${status}`, data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
