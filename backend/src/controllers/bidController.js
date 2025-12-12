

import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import { v4 as uuidv4 } from 'uuid';
import logger from "../utils/logger.js";

// NOTE: This controller maps 'bids' to 'job_applications' table to align with schema.
// 'bids' table in schema is for Project-level bids, not Job-level.

export const placeBid = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_id, project_id, amount, proposal, estimated_duration, start_date } = req.body;

        // Start with Project Bid Logic
        if (project_id) {
            if (!amount) {
                return res.status(400).json(formatResponse(false, "Missing amount for project bid", null));
            }

            // Check if already bid on project
            const { data: existing } = await supabase
                .from("bids")
                .select("id")
                .eq("project_id", project_id)
                .eq("submitted_by", userId)
                .single();

            if (existing) {
                return res.status(400).json(formatResponse(false, "You have already placed a bid on this project", null));
            }

            const { data, error } = await supabase
                .from("bids")
                .insert({
                    project_id,
                    submitted_by: userId,
                    amount,
                    notes: proposal,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(formatResponse(true, "Project bid placed successfully", data));
        }

        // Fallback to Job Application Logic
        if (!job_id || !amount || !proposal) {
            return res.status(400).json(formatResponse(false, "Missing required fields (job_id or project_id)", null));
        }

        // Check if already applied
        const { data: existing } = await supabase
            .from("job_applications")
            .select("id")
            .eq("job_id", job_id)
            .eq("contractor_id", userId)
            .single();

        if (existing) {
            return res.status(400).json(formatResponse(false, "You have already placed a bid (application) on this job", null));
        }

        const { data, error } = await supabase
            .from("job_applications")
            .insert({
                job_id,
                contractor_id: userId,
                proposed_rate: amount, // Map amount to proposed_rate
                cover_letter: proposal, // Map proposal to cover_letter
                available_start_date: start_date,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Bid placed successfully", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobBids = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_id } = req.params;

        // Verify job ownership
        const { data: job } = await supabase.from("jobs").select("project_manager_id").eq("id", job_id).single();
        if (!job) return res.status(404).json(formatResponse(false, "Job not found", null));

        if (job.project_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        // Fetch bids raw
        const { data: bids, error } = await supabase
            .from("job_applications")
            .select("*")
            .eq("job_id", job_id)
            .order("proposed_rate", { ascending: true });

        if (error) throw error;

        // Manual Join
        let enrichedBids = [];
        if (bids && bids.length > 0) {
            const contractorIds = [...new Set(bids.map(b => b.contractor_id))];

            const { data: contractors } = await supabase
                .from("users")
                .select("id, first_name, last_name, avatar_url, trust_score")
                .in("id", contractorIds);

            const contractorMap = {};
            if (contractors) {
                contractors.forEach(c => contractorMap[c.id] = c);
            }

            enrichedBids = bids.map(b => ({
                ...b,
                contractor: contractorMap[b.contractor_id] || null
            }));
        }

        return res.json(formatResponse(true, "Bids retrieved", enrichedBids));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getMyBids = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("job_applications")
            .select(`
        *,
        job:jobs (id, title, status, budget_min, budget_max)
      `)
            .eq("contractor_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "My bids retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateBidStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'rejected', 'awarded'].includes(status)) {
            return res.status(400).json(formatResponse(false, "Invalid status", null));
        }

        // 1. Check Project Bids (bids table)
        const { data: projectBid } = await supabase
            .from("bids")
            .select("*, project:projects(owner_id)")
            .eq("id", id)
            .single();

        if (projectBid) {
            // Verify Owner
            if (projectBid.project.owner_id !== userId) {
                return res.status(403).json(formatResponse(false, "Unauthorized", null));
            }

            // Update Bid Status
            const { data, error } = await supabase
                .from("bids")
                .update({ status })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            // If accepted or awarded, update Project
            if (status === 'accepted' || status === 'awarded') {
                await supabase.from("projects")
                    .update({
                        contractor_id: projectBid.submitted_by,
                        total_amount: projectBid.amount,
                        status: 'in_progress'
                    })
                    .eq("id", projectBid.project_id);
            }

            return res.json(formatResponse(true, `Bid ${status}`, data));
        }

        // 2. Fallback to Job Applications
        const { data: app } = await supabase.from("job_applications").select("*, job:jobs(project_manager_id)").eq("id", id).single();
        if (!app) return res.status(404).json(formatResponse(false, "Bid not found", null));

        if (app.job.project_manager_id !== userId) {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        const { data, error } = await supabase
            .from("job_applications")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // If accepted, create Project logic (simplified)
        if (status === 'accepted' || status === 'awarded') {
            await supabase.from("jobs").update({ status: 'in_progress' }).eq("id", app.job_id);
            await supabase.from("projects").insert({
                id: uuidv4(),
                owner_id: userId,
                contractor_id: app.contractor_id,
                title: `Project for Job #${app.job_id}`,
                total_amount: app.proposed_rate,
                status: 'active'
            });
        }

        return res.json(formatResponse(true, `Bid ${status}`, data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const withdrawBid = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data: app } = await supabase.from("job_applications").select("contractor_id, status").eq("id", id).single();
        if (!app) return res.status(404).json(formatResponse(false, "Bid not found", null));
        if (app.contractor_id !== userId) return res.status(403).json(formatResponse(false, "Unauthorized", null));

        const { error } = await supabase.from("job_applications").update({ status: 'withdrawn' }).eq("id", id);
        if (error) throw error;

        return res.json(formatResponse(true, "Bid withdrawn successfully", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get all bids (for public API)
export const getAllBids = async (req, res) => {
    try {
        const { limit = 100, offset = 0, status, job_id, project_id } = req.query;

        // Try to get project bids first
        let query = supabase
            .from('bids')
            .select(`
                *,
                project_manager:users!bids_project_manager_id_fkey(id, email, first_name, last_name, avatar_url)
            `, { count: 'exact' })
            .range(offset, offset + parseInt(limit) - 1)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (project_id) {
            query = query.eq('project_id', project_id);
        }

        const { data, count, error } = await query;

        if (error) {
            logger.error('Get bids error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "Bids retrieved", {
            bids: data || [],
            total: count || 0
        }));
    } catch (err) {
        logger.error('Get all bids error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
