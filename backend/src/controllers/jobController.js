import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import { notificationService } from "../services/notificationService.js";
import logger from "../utils/logger.js";

export const createJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title, description, budget_min, budget_max, location,
            trade_type, specialization, urgency, requirements, images, documents,
            pay_type, pay_rate, start_date, end_date,
            // Also accept these alternate field names from frontend
            trade, budget, deadline, timeline
        } = req.body;

        // Use either field name
        const finalTradeType = trade_type || trade;
        const finalLocation = location;

        if (!title || !description) {
            return res.status(400).json(formatResponse(false, "Title and description are required", null));
        }

        // Handle requirements - can be string or object
        let finalRequirements = {};
        if (requirements) {
            if (typeof requirements === 'string') {
                finalRequirements = { text: requirements };
            } else {
                finalRequirements = requirements;
            }
        }

        const { data, error } = await supabase
            .from("jobs")
            .insert({
                projects_manager_id: userId,
                created_by: userId,
                title,
                descriptions: description,
                budget_min: budget_min || null,
                budget_max: budget_max || null,
                location: finalLocation || null,
                trade_type: finalTradeType || null,
                specialization,
                urgency: urgency || 'medium',
                requirements: finalRequirements,
                images: images || [],
                documents: documents || [],
                pay_type,
                pay_rate,
                start_date: (start_date && !isNaN(Date.parse(start_date))) ? start_date : null,
                end_date: (end_date && !isNaN(Date.parse(end_date))) ? end_date : null,
                timeline: deadline || timeline || null,
                status: 'open',
                application_count: 0
            })
            .select()
            .single();

        if (error) {
            logger.error('createJob DB Error:', error);
            throw error;
        }

        // Notify PM that job is posted
        await notificationService.send(userId, "Job Posted", `Your job "${title}" is now live and accepting applications.`, "success");

        return res.status(201).json(formatResponse(true, "Job posted successfully", data));
    } catch (err) {
        logger.error('createJob Error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, trade_type, location, min_budget, max_budget } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from("jobs")
            .select(`
        *,
        description:descriptions,
        project_manager:users!inner(id, first_name, last_name, avatar_url, trust_score)
      `, { count: 'exact' })
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) query = query.ilike('title', `%${search}%`);
        if (trade_type) query = query.eq('trade_type', trade_type);
        if (location) query = query.ilike('location', `%${location}%`);
        if (min_budget) query = query.gte('budget_min', min_budget);
        if (max_budget) query = query.lte('budget_max', max_budget);

        const { data, count, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Jobs retrieved", { jobs: data, total: count, page: parseInt(page), pages: Math.ceil(count / limit) }));
    } catch (err) {
        logger.error('getJobs Error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("jobs")
            .select(`
        *,
        description:descriptions,
        project_manager:users!jobs_projects_manager_id_fkey(id, first_name, last_name, avatar_url, trust_score, created_at),
        applications:job_applications!job_applications_job_id_fkey (count)
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error("getJobById Error:", error);
            return res.status(404).json(formatResponse(false, "Job not found", null));
        }

        // Increment view count (optional, if RPC exists)
        // await supabase.rpc('increment_job_view', { job_id: id }).catch(() => {});

        return res.json(formatResponse(true, "Job details retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        // Check ownership
        const { data: job } = await supabase.from("jobs").select("projects_manager_id").eq("id", id).single();
        if (!job) return res.status(404).json(formatResponse(false, "Job not found", null));
        if (job.projects_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        const { data, error } = await supabase
            .from("jobs")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Job updated successfully", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const deleteJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Check ownership
        const { data: job } = await supabase.from("jobs").select("projects_manager_id").eq("id", id).single();
        if (!job) return res.status(404).json(formatResponse(false, "Job not found", null));
        if (job.projects_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        const { error } = await supabase.from("jobs").delete().eq("id", id);
        if (error) throw error;

        return res.json(formatResponse(true, "Job deleted successfully", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify ownership
        const { data: job } = await supabase.from("jobs").select("projects_manager_id").eq("id", id).single();

        if (!job) return res.status(404).json(formatResponse(false, "Job not found", null));

        // Allow PM or Admin to view
        if (job.projects_manager_id !== userId && req.user.role !== 'admin') {
            console.log(`[Auth Check] Failed: User ${userId} is not Owner ${job.projects_manager_id} nor Admin`);
            // Return empty list instead of 403 to prevent UI errors for non-owners
            return res.json(formatResponse(true, "Job applications retrieved (Hidden for non-owners)", []));
        }

        // Fetch applications with contractor details
        const { data: applications, error } = await supabase
            .from("job_applications")
            .select(`
                *,
                contractor:users!job_applications_contractor_id_fkey(id, first_name, last_name, avatar_url, trust_score)
            `)
            .eq("job_id", id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("getJobApplications Error:", error);
            // Fallback for foreign key if named differently
            if (error.code === 'PGRST201' || error.message?.includes('embedding')) {
                // Try simple join
                const { data: retryData, error: retryError } = await supabase
                    .from("job_applications")
                    .select(`
                        *,
                        contractor:users(id, first_name, last_name, avatar_url, trust_score)
                    `)
                    .eq("job_id", id)
                    .order("created_at", { ascending: false });

                if (retryError) throw retryError;
                return res.json(formatResponse(true, "Job applications retrieved", retryData));
            }
            throw error;
        }

        return res.json(formatResponse(true, "Job applications retrieved", applications));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
