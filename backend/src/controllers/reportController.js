import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Report content
export const reportContent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content_type, content_id, reason, description } = req.body;

        if (!content_type || !content_id || !reason) {
            return res.status(400).json(formatResponse(false, "Content type, ID, and reason required", null));
        }

        const validTypes = ['job', 'user', 'review', 'message', 'portfolio', 'project'];
        if (!validTypes.includes(content_type)) {
            return res.status(400).json(formatResponse(false, "Invalid content type", null));
        }

        const { data, error } = await supabase
            .from("content_reports")
            .insert({
                content_type,
                content_id,
                reported_by: userId,
                reason,
                description,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Content reported", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get reports (admin)
export const getReports = async (req, res) => {
    try {
        const { status, content_type, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        let query = supabase
            .from("content_reports")
            .select("*", { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (status) query = query.eq("status", status);
        if (content_type) query = query.eq("content_type", content_type);

        const { data, count, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Reports retrieved", {
            reports: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update report status (admin)
export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, action_taken, admin_notes } = req.body;

        if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json(formatResponse(false, "Invalid status", null));
        }

        const { data, error } = await supabase
            .from("content_reports")
            .update({
                status,
                action_taken,
                admin_notes,
                reviewed_by: req.user.id,
                reviewed_at: new Date()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Report updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
