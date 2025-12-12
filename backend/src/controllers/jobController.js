import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import logger from "../utils/logger.js";

export const createJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title, description, budget_min, budget_max, location,
            trade_type, specialization, urgency, requirements, images, documents,
            pay_type, pay_rate, start_date, end_date
        } = req.body;

        if (!title || !description || !location || !trade_type) {
            return res.status(400).json(formatResponse(false, "Missing required fields", null));
        }

        const { data, error } = await supabase
            .from("jobs")
            .insert({
                project_manager_id: userId,
                title,
                description,
                budget_min,
                budget_max,
                location,
                trade_type,
                specialization,
                urgency: urgency || 'medium',
                requirements: requirements || {},
                images: images || [],
                documents: documents || [],
                pay_type,
                pay_rate,
                start_date,
                end_date,
                status: 'open',
                application_count: 0
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Job posted successfully", data));
    } catch (err) {
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
        project_manager:users!inner(id, first_name, last_name, avatar_url, trust_score, created_at),
        applications:job_applications (count)
      `)
            .eq('id', id)
            .single();

        if (error) return res.status(404).json(formatResponse(false, "Job not found", null));

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
        const { data: job } = await supabase.from("jobs").select("project_manager_id").eq("id", id).single();
        if (!job) return res.status(404).json(formatResponse(false, "Job not found", null));
        if (job.project_manager_id !== userId && req.user.role !== 'admin') {
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
        const { data: job } = await supabase.from("jobs").select("project_manager_id").eq("id", id).single();
        if (!job) return res.status(404).json(formatResponse(false, "Job not found", null));
        if (job.project_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        const { error } = await supabase.from("jobs").delete().eq("id", id);
        if (error) throw error;

        return res.json(formatResponse(true, "Job deleted successfully", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
