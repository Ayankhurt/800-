import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Get Audit Logs
export const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action_type, user_id, resource_type, date_from, date_to } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from("audit_logs")
            .select("*", { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (action_type) query = query.eq("action_type", action_type);
        if (user_id) query = query.eq("user_id", user_id);
        if (resource_type) query = query.eq("resource_type", resource_type);
        if (date_from) query = query.gte("created_at", date_from);
        if (date_to) query = query.lte("created_at", date_to);

        const { data, count, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Audit logs retrieved", {
            logs: data || [],
            total: count || 0,
            page: parseInt(page),
            pages: Math.ceil((count || 0) / limit)
        }));
    } catch (err) {
        console.error('Get audit logs error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get Admin Activity Logs (alias for audit logs filtered by admin users)
export const getAdminLogs = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        let query = supabase
            .from("audit_logs")
            .select("*", { count: 'exact' })
            .range(offset, offset + parseInt(limit) - 1)
            .order("created_at", { ascending: false });

        const { data, count, error } = await query;

        if (error) {
            console.error('Get admin logs error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "Admin logs retrieved", {
            logs: data || [],
            total: count || 0
        }));
    } catch (err) {
        console.error('Get admin logs error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
