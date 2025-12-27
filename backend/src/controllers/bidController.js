

import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import { v4 as uuidv4 } from 'uuid';
import logger from "../utils/logger.js";

// NOTE: This controller maps 'bids' to 'job_applications' table to align with schema.
// 'bids' table in schema is for Project-level bids, not Job-level.

// Create a new Bid Request (by PM/GC/CLIENT)
export const createBidRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = (req.user.role || '').toUpperCase();
        const { project_id, job_id, title, description, due_date, contractor_id, amount } = req.body;

        console.log('[DEBUG] Creating bid request:', { userId, project_id, job_id, title, contractor_id, amount });

        if (!title || !description) {
            return res.status(400).json(formatResponse(false, "Title and description are required", null));
        }

        const bidData = {
            project_manager_id: userId,
            title,
            descriptions: amount ? `[Budget: $${amount}]\n\n${description}` : description,
            due_date: due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            project_id: project_id || null,
            job_id: job_id || null
        };

        // Only add contractor_id if provided (for direct invitations)
        if (contractor_id) {
            bidData.contractor_id = contractor_id;
        }

        console.log('[DEBUG] Bid data to insert:', bidData);

        // PM, GC, CLIENT can all manage their own projects/bids
        const { data, error } = await supabase
            .from("bids")
            .insert(bidData)
            .select()
            .single();

        if (error) {
            console.error('[DEBUG] Bid creation error:', error);
            throw error;
        }

        console.log('[DEBUG] Bid created successfully:', data);
        return res.status(201).json(formatResponse(true, "Bid request created successfully", data));
    } catch (err) {
        logger.error("Create bid request error:", err);
        console.error('[DEBUG] Full error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Submit a bid response (by Contractor) - Handles both Project Bids and Job Applications
export const submitBidResponse = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: bidId } = req.params;
        const { amount, proposal_text, timeline_days, attachments, notes, proposal } = req.body;

        // Determine if this is a Bid Request (Project Invitation) or a Job
        const { data: bidRequest } = await supabase.from("bids").select("id").eq("id", bidId).single();

        if (bidRequest) {
            // CASE 1: This is a PROJECT BID INVITATION
            // Check if already submitted
            const { data: existing } = await supabase
                .from("bid_submissions")
                .select("id")
                .eq("bid_id", bidId)
                .eq("contractor_id", userId)
                .single();

            if (existing) {
                return res.status(400).json(formatResponse(false, "You have already submitted a response for this bid", null));
            }

            const { data, error } = await supabase
                .from("bid_submissions")
                .insert({
                    bid_id: bidId,
                    contractor_id: userId,
                    amount,
                    proposal_text: proposal_text || notes || proposal || "", // Fallbacks
                    timeline_days: timeline_days || 0,
                    attachments: attachments || [],
                    status: 'submitted'
                })
                .select()
                .single();

            if (error) throw error;

            // Update bid status to 'submitted' if it was 'pending'
            await supabase.from("bids").update({ status: 'submitted' }).eq("id", bidId).eq("status", 'pending');

            return res.status(201).json(formatResponse(true, "Bid submitted successfully", data));
        }

        // CASE 2: This might be a JOB APPLICATION
        const { data: job } = await supabase.from("jobs").select("id, title").eq("id", bidId).single();

        if (job) {
            // Check if already applied
            const { data: existingApp } = await supabase
                .from("job_applications")
                .select("id")
                .eq("job_id", bidId)
                .eq("contractor_id", userId)
                .single();

            if (existingApp) {
                return res.status(400).json(formatResponse(false, "You have already applied to this job", null));
            }

            const { data, error } = await supabase
                .from("job_applications")
                .insert({
                    job_id: bidId,
                    contractor_id: userId,
                    proposed_rate: amount,
                    cover_letter: proposal_text || notes || proposal || "",
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            return res.status(201).json(formatResponse(true, "Application submitted successfully", data));
        }

        // Neither a bid nor a job
        return res.status(404).json(formatResponse(false, "Bid or job not found", null));

    } catch (err) {
        logger.error("Submit bid response error:", err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Old placeBid kept for backward compatibility if needed, but updated to use new logic
export const placeBid = async (req, res) => {
    if (req.params.id) return submitBidResponse(req, res);
    return createBidRequest(req, res);
};

// Compare bids for a job
export const compareBids = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const userId = req.user.id;

        // Fetch submissions
        const { data: submissions, error } = await supabase
            .from("bid_submissions")
            .select(`
                *,
                contractor:contractor_id (id, first_name, last_name, avatar_url, trust_score, company_name)
            `)
            .eq("bid_id", jobId);

        if (error) throw error;

        // Fetch job applications to compare as well
        const { data: apps } = await supabase
            .from("job_applications")
            .select(`
                *,
                contractor:contractor_id (id, first_name, last_name, avatar_url, trust_score, company_name)
            `)
            .eq("job_id", jobId);

        const allBids = [
            ...(submissions || []),
            ...(apps || []).map(a => ({
                ...a,
                proposal_text: a.cover_letter,
                amount: a.proposed_rate,
                is_application: true
            }))
        ];

        return res.json(formatResponse(true, "Comparison data", {
            bids: allBids,
            average_bid: allBids.length > 0 ? allBids.reduce((acc, b) => acc + (b.amount || 0), 0) / allBids.length : 0,
            lowest_bid: allBids.length > 0 ? Math.min(...allBids.map(b => b.amount || Infinity)) : 0,
            highest_bid: allBids.length > 0 ? Math.max(...allBids.map(b => b.amount || 0)) : 0
        }));
    } catch (err) {
        logger.error("Compare bids error:", err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get single bid details
export const getBidDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1. Try to find in 'bids' table (Project Bid Invitations)
        const { data: bid, error: bidError } = await supabase
            .from("bids")
            .select(`
                *,
                project_manager:project_manager_id (id, email, first_name, last_name, avatar_url),
                project:projects(id, title, description, status),
                contractor:contractor_id (id, email, first_name, last_name, avatar_url, company_name)
            `)
            .eq("id", id)
            .single();

        if (bid) {
            return res.json(formatResponse(true, "Bid details retrieved", bid));
        }

        // 2. Try to find in 'job_applications' table (Job Bids)
        const { data: app, error: appError } = await supabase
            .from("job_applications")
            .select(`
                *,
                job:jobs!fk_job_applications_job_id (id, title, locations, status, projects_manager_id, budget_min, budget_max),
                contractor:contractor_id (id, email, first_name, last_name, avatar_url, company_name)
            `)
            .eq("id", id)
            .single();

        if (app) {
            // Map job_application to bid-like structure for frontend
            const mappedApp = {
                ...app,
                title: app.job?.title || "Job Application",
                description: app.cover_letter,
                amount: app.proposed_rate,
                project_manager_id: app.job?.projects_manager_id,
                is_job_application: true
            };
            return res.json(formatResponse(true, "Application details retrieved", mappedApp));
        }

        return res.status(404).json(formatResponse(false, "Bid not found", null));
    } catch (err) {
        logger.error("Get bid details error:", err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobBids = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_id } = req.params;

        console.log(`[DEBUG] getJobBids hit. Job/Bid ID: ${job_id}, User ID: ${userId}`);

        // Determines if this is a Bid (Project Invite) or a Job
        // 1. Check if is a Bid
        const { data: bid, error: bidError } = await supabase
            .from("bids")
            .select("*, project:projects!bids_project_id_fkey(owner_id)")
            .eq("id", job_id)
            .single();

        if (bidError && bidError.code !== 'PGRST116') { // PGRST116 is "JSON object requested, multiple (or no) rows returned", which is fine (not found)
            console.log('[DEBUG] Error fetching bid in getJobBids:', bidError);
        }

        if (bid) {
            console.log('[DEBUG] Found valid Bid:', bid.id);
            // It is a BID INVITATION. Check ownership.
            // Owner is the one who created the project/bid
            const ownerId = bid.projects_manager_id || bid.project?.owner_id;

            if (ownerId && ownerId !== userId && req.user.role !== 'admin' && req.user.role_code !== 'SUPER') {
                // Also allow if user is a contractor who submitted? No, this is for viewing submissions.
                // Only owner gets to see submissions usually.
                console.log(`[DEBUG] Unauthorized access to bid submissions. Owner: ${ownerId}, User: ${userId}`);
                return res.status(403).json(formatResponse(false, "Unauthorized to view bid submissions", null));
            }

            // Fetch submissions for this BID
            const { data: submissions, error } = await supabase
                .from("bid_submissions")
                .select("*")
                .eq("bid_id", job_id)
                .order("amount", { ascending: true });

            if (error) throw error;

            console.log(`[DEBUG] Found ${submissions?.length || 0} submissions for bid ${job_id}`);

            // Enrich with contractor
            let enriched = [];
            if (submissions && submissions.length > 0) {
                const contractorIds = [...new Set(submissions.map(s => s.contractor_id))];
                const { data: contractors } = await supabase.from("users").select("id, first_name, last_name, avatar_url, trust_score").in("id", contractorIds);
                const contractorMap = {};
                if (contractors) contractors.forEach(c => contractorMap[c.id] = c);
                enriched = submissions.map(s => ({ ...s, contractor: contractorMap[s.contractor_id] || null }));
            }

            return res.json(formatResponse(true, "Bid submissions retrieved", enriched || []));
        }

        // 2. Not a Bid? Assume it's a JOB.
        const { data: job, error: jobError } = await supabase.from("jobs").select("projects_manager_id").eq("id", job_id).single();

        if (jobError && jobError.code !== 'PGRST116') {
            console.log('[DEBUG] Error fetching job in getJobBids:', jobError);
        }

        if (job) {
            if (job.projects_manager_id !== userId && req.user.role !== 'admin' && req.user.role_code !== 'SUPER') {
                return res.status(403).json(formatResponse(false, "Unauthorized", null));
            }

            // Fetch applications (bids) for this JOB
            const { data: bids, error: err2 } = await supabase
                .from("job_applications")
                .select("*")
                .eq("job_id", job_id) // "bids" table uses job_id for job applications? No, "job_applications" table.
                .order("proposed_rate", { ascending: true });

            if (err2) {
                logger.error("Error fetching job applications:", err2);
                return res.json(formatResponse(true, "No applications found", []));
            }

            // Enrich
            let enriched = [];
            if (bids && bids.length > 0) {
                const contractorIds = [...new Set(bids.map(b => b.contractor_id))];
                const { data: contractors } = await supabase.from("users").select("id, first_name, last_name, avatar_url, trust_score").in("id", contractorIds);
                const contractorMap = {};
                if (contractors) contractors.forEach(c => contractorMap[c.id] = c);
                enriched = bids.map(b => ({ ...b, contractor: contractorMap[b.contractor_id] || null, amount: b.proposed_rate, description: b.cover_letter })); // Map for uniform frontend
            }
            return res.json(formatResponse(true, "Job applications retrieved", enriched));
        }

        return res.status(404).json(formatResponse(false, "Job or Bid not found", null));

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
        job:jobs!fk_job_applications_job_id (id, title, status, budget_min, budget_max)
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
        console.log(`[DEBUG] updateBidStatus ID: ${id}, status: ${status}`);
        const { data: projectBid, error: projectBidErr } = await supabase
            .from("bids")
            .select("*, project:projects(owner_id)")
            .eq("id", id)
            .single();

        if (projectBidErr) console.log(`[DEBUG] projectBidErr:`, projectBidErr.message);

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
                        contractor_id: projectBid.contractor_id,
                        total_amount: projectBid.total_amount || 0,
                        status: 'in_progress'
                    })
                    .eq("id", projectBid.project_id);
            }

            return res.json(formatResponse(true, `Bid ${status}`, data));
        }

        // 2. Fallback to Job Applications
        const { data: app, error: appErr } = await supabase.from("job_applications").select("*, job:jobs!job_applications_job_id_fkey(projects_manager_id)").eq("id", id).single();
        if (appErr) console.log(`[DEBUG] updateBidStatus appErr:`, appErr.message);

        if (!app) return res.status(404).json(formatResponse(false, "Bid not found", null));

        if (app.job.projects_manager_id !== userId) {
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
        const userId = req.user.id;
        const role = (req.user.role || '').toUpperCase();

        console.log('[DEBUG] getAllBids - userId:', userId, 'role:', role);

        // Build query for bids
        let query = supabase
            .from('bids')
            .select(`
                *,
                project_manager:users!bids_project_manager_id_fkey (id, email, first_name, last_name, avatar_url),
                project:projects!bids_project_id_fkey(id, title),
                submissions:bid_submissions!bid_submissions_bid_id_fkey (id)
            `, { count: 'exact' });

        // Filter by user role if not admin
        if (role !== 'ADMIN') {
            // For PMs, show bids they created
            // For Contractors, show bids where they are the contractor_id or have a submission
            if (role === 'PM' || role === 'GC') {
                console.log('[DEBUG] Filtering for PM/GC - showing bids created by user');
                query = query.or(`project_manager_id.eq.${userId},contractor_id.eq.${userId}`);
            } else if (role === 'CONTRACTOR') {
                console.log('[DEBUG] Filtering for Contractor - showing bids they can bid on');
                query = query.eq('contractor_id', userId);
            }
        } else {
            console.log('[DEBUG] Admin user - showing all bids');
        }

        if (status) query = query.eq('status', status);
        if (project_id) query = query.eq('project_id', project_id);
        if (job_id) query = query.or(`job_id.eq.${job_id},jobs_id.eq.${job_id}`);

        query = query.range(offset, offset + parseInt(limit) - 1).order('created_at', { ascending: false });

        const { data, count, error } = await query;

        if (error) {
            logger.error('Get bids error:', error);
            throw error;
        }

        console.log('[DEBUG] Found', data?.length || 0, 'bids from bids table');

        // Add Job Applications too if this is a general "My Bids" request
        let finalBids = data || [];
        if (!job_id && !project_id) {
            let jobAppsQuery = supabase
                .from('job_applications')
                .select('*, job:jobs!fk_job_applications_job_id(id, title, locations, projects_manager_id, budget_min, budget_max)');

            if (role === 'CONTRACTOR') {
                jobAppsQuery = jobAppsQuery.eq('contractor_id', userId);
            } else if (role === 'PM' || role === 'GC') {
                // PMs see applications for their jobs
                // We first fetch job ids owned by PM
                const { data: myJobs } = await supabase.from('jobs').select('id').eq('projects_manager_id', userId);
                const myJobIds = myJobs ? myJobs.map(j => j.id) : [];
                if (myJobIds.length > 0) {
                    jobAppsQuery = jobAppsQuery.in('job_id', myJobIds);
                } else {
                    jobAppsQuery = jobAppsQuery.eq('job_id', null); // No jobs, no applications
                }
            }
            // Admin sees all job applications, no additional filter needed

            const { data: jobApps } = await jobAppsQuery;

            if (jobApps) {
                const mappedApps = jobApps.map(app => ({
                    id: app.id,
                    title: `Application: ${app.job?.title || 'Job'}`,
                    notes: app.cover_letter,
                    amount: app.proposed_rate,
                    status: app.status,
                    created_at: app.created_at,
                    project: app.job,
                    is_job_application: true,
                    submitted_count: 1 // For contractor's view, it's their own submission
                }));
                finalBids = [...finalBids, ...mappedApps];
            }
        }

        // Enrich bids with submission counts
        const enrichedBids = finalBids.map(bid => ({
            ...bid,
            submitted_count: bid.submissions ? bid.submissions.length : (bid.submitted_count || 0),
            contractor_count: bid.contractor_count || (bid.contractor_id ? 1 : 0)
        }));

        return res.json(formatResponse(true, "Bids retrieved", {
            bids: enrichedBids,
            total: (count || 0) + (finalBids.length - (data?.length || 0))
        }));
    } catch (err) {
        logger.error('Get all bids error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
