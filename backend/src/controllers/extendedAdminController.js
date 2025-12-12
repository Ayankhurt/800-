import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// ==================== AI FEATURES ====================

export const getAiContracts = async (req, res) => {
    try {
        const { page = 1, limit = 50, project_id } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from("ai_generated_contracts")
            .select(`
        *,
        project:projects(id, title)
      `, { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (project_id) query = query.eq("project_id", project_id);

        const { data, count, error } = await query;
        if (error) throw error;

        return res.json(formatResponse(true, "AI Contracts retrieved", {
            contracts: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getAiAnalysis = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const { data, count, error } = await supabase
            .from("ai_progress_analysis")
            .select("*", { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("analyzed_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "AI Analysis retrieved", {
            analysis: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==================== MARKETING (EMAIL CAMPAIGNS) ====================

export const getEmailCampaigns = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("email_campaigns")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return res.json(formatResponse(true, "Campaigns retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const createEmailCampaign = async (req, res) => {
    try {
        const { name, subject, content, target_segment, scheduled_at } = req.body;

        const { data, error } = await supabase
            .from("email_campaigns")
            .insert({
                name,
                subject,
                content,
                target_segment,
                scheduled_at,
                created_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;
        return res.json(formatResponse(true, "Campaign created", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==================== SECURITY LOGS ====================

export const getBlockedIps = async (req, res) => {
    try {
        const { data, error } = await supabase.from("blocked_ips").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return res.json(formatResponse(true, "Blocked IPs retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const blockIp = async (req, res) => {
    try {
        const { ip, reason } = req.body;
        const { data, error } = await supabase
            .from("blocked_ips")
            .insert({ ip, reason, blocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000) }) // 24h block
            .select()
            .single();

        if (error) throw error;
        return res.json(formatResponse(true, "IP blocked", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const unblockIp = async (req, res) => {
    try {
        const { ip } = req.params; // Assuming IP is passed as param, might need encoding
        const { error } = await supabase.from("blocked_ips").delete().eq("ip", ip);
        if (error) throw error;
        return res.json(formatResponse(true, "IP unblocked", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getDdosLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
            .from("ddos_logs")
            .select("*", { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return res.json(formatResponse(true, "DDoS logs retrieved", { logs: data, total: count }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getFailedLogins = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        const { data, count, error } = await supabase
            .from("failed_logins")
            .select("*", { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return res.json(formatResponse(true, "Failed logins retrieved", { logs: data, total: count }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
