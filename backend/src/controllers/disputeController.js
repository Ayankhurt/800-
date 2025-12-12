import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// File a dispute
export const fileDispute = async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id, reason, description, amount_disputed, evidence } = req.body;

        if (!project_id || !reason || !description) {
            return res.status(400).json(formatResponse(false, "Project ID, reason, and description required", null));
        }

        // Verify user is part of the project
        const { data: project } = await supabase
            .from("projects")
            .select("owner_id, contractor_id")
            .eq("id", project_id)
            .single();

        if (!project) {
            return res.status(404).json(formatResponse(false, "Project not found", null));
        }

        if (project.owner_id !== userId && project.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, "You are not part of this project", null));
        }

        const { data, error } = await supabase
            .from("disputes")
            .insert({
                project_id,
                raised_by: userId,
                reason,
                description,
                status: 'open',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Freeze project payments
        await supabase
            .from("projects")
            .update({ payment_frozen: true })
            .eq("id", project_id);

        return res.status(201).json(formatResponse(true, "Dispute filed successfully", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get all disputes (admin) or user's disputes
export const getDisputes = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { status, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        let query = supabase
            .from("disputes")
            .select(`
        *,
        project:projects (id, title, owner_id, contractor_id),
        raised_by_user:users!disputes_raised_by_fkey (id, first_name, last_name, avatar_url)
      `, { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        // Admin can see all disputes
        if (role !== 'admin') {
            // Simplified filter to avoid complex logic tree errors with joined tables
            query = query.eq('raised_by', userId);
        }

        if (status) {
            query = query.eq("status", status);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Disputes retrieved", {
            disputes: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get dispute details
export const getDisputeById = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const { id } = req.params;

        const { data, error } = await supabase
            .from("disputes")
            .select(`
        *,
        project:projects (*),
        raised_by_user:users!disputes_raised_by_fkey (id, first_name, last_name, email, avatar_url),
        responses:dispute_responses (*)
      `)
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json(formatResponse(false, "Dispute not found", null));
        }

        // Check access
        if (role !== 'admin' &&
            data.raised_by !== userId &&
            data.project.owner_id !== userId &&
            data.project.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        return res.json(formatResponse(true, "Dispute details retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Add response to dispute
export const addDisputeResponse = async (req, res) => {
    try {
        const userId = req.user.id;
        const { dispute_id } = req.params;
        const { message, evidence } = req.body;

        if (!message) {
            return res.status(400).json(formatResponse(false, "Message required", null));
        }

        // Verify access to dispute
        const { data: dispute } = await supabase
            .from("disputes")
            .select("*, project:projects(owner_id, contractor_id)")
            .eq("id", dispute_id)
            .single();

        if (!dispute) {
            return res.status(404).json(formatResponse(false, "Dispute not found", null));
        }

        if (dispute.raised_by !== userId &&
            dispute.project.owner_id !== userId &&
            dispute.project.contractor_id !== userId &&
            req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        const { data, error } = await supabase
            .from("dispute_responses")
            .insert({
                dispute_id,
                user_id: userId,
                message,
                evidence: evidence || []
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Response added", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Resolve dispute (admin only)
export const resolveDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution, resolution_notes, amount_to_client, amount_to_contractor } = req.body;

        if (!resolution || !resolution_notes) {
            return res.status(400).json(formatResponse(false, "Resolution and notes required", null));
        }

        const { data, error } = await supabase
            .from("disputes")
            .update({
                status: 'resolved',
                resolution,
                resolution_notes,
                amount_to_client,
                amount_to_contractor,
                resolved_at: new Date(),
                resolved_by: req.user.id
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Unfreeze project payments
        await supabase
            .from("projects")
            .update({ payment_frozen: false })
            .eq("id", data.project_id);

        return res.json(formatResponse(true, "Dispute resolved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Close dispute (withdraw)
export const closeDispute = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data: dispute } = await supabase
            .from("disputes")
            .select("raised_by, project_id")
            .eq("id", id)
            .single();

        if (!dispute) {
            return res.status(404).json(formatResponse(false, "Dispute not found", null));
        }

        if (dispute.raised_by !== userId) {
            return res.status(403).json(formatResponse(false, "Only the filer can close the dispute", null));
        }

        const { data, error } = await supabase
            .from("disputes")
            .update({ status: 'closed' })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Unfreeze project payments
        await supabase
            .from("projects")
            .update({ payment_frozen: false })
            .eq("id", dispute.project_id);

        return res.json(formatResponse(true, "Dispute closed", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
