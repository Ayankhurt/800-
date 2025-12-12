import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Invite contractor to job
export const inviteContractor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_id, contractor_id, message } = req.body;

        if (!job_id || !contractor_id) {
            return res.status(400).json(formatResponse(false, "Job ID and contractor ID required", null));
        }

        // Verify job ownership
        const { data: job } = await supabase
            .from("jobs")
            .select("project_manager_id")
            .eq("id", job_id)
            .single();

        if (!job) {
            return res.status(404).json(formatResponse(false, "Job not found", null));
        }

        if (job.project_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        // Check if already invited
        const { data: existing } = await supabase
            .from("job_invites")
            .select("id")
            .eq("job_id", job_id)
            .eq("contractor_id", contractor_id)
            .single();

        if (existing) {
            return res.status(400).json(formatResponse(false, "Contractor already invited", null));
        }

        const { data, error } = await supabase
            .from("job_invites")
            .insert({
                job_id,
                contractor_id,
                invited_by: userId,
                message,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Create notification
        await supabase
            .from("notifications")
            .insert({
                user_id: contractor_id,
                type: 'job_invite',
                title: 'New Job Invitation',
                message: `You have been invited to apply for a job`,
                reference_id: job_id
            });

        return res.status(201).json(formatResponse(true, "Contractor invited", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get job invites (contractor)
export const getMyInvites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = supabase
            .from("job_invites")
            .select("*")
            .eq("contractor_id", userId)
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Invites retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Respond to invite
export const respondToInvite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body; // accepted, declined

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json(formatResponse(false, "Invalid status", null));
        }

        const { data: invite } = await supabase
            .from("job_invites")
            .select("contractor_id")
            .eq("id", id)
            .single();

        if (!invite) {
            return res.status(404).json(formatResponse(false, "Invite not found", null));
        }

        if (invite.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        const { data, error } = await supabase
            .from("job_invites")
            .update({ status, responded_at: new Date() })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, `Invite ${status}`, data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get sent invites (job owner)
export const getSentInvites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_id } = req.params;

        // Verify job ownership
        const { data: job } = await supabase
            .from("jobs")
            .select("project_manager_id")
            .eq("id", job_id)
            .single();

        if (!job) {
            return res.status(404).json(formatResponse(false, "Job not found", null));
        }

        if (job.project_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        const { data, error } = await supabase
            .from("job_invites")
            .select("*")
            .eq("job_id", job_id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Sent invites retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
