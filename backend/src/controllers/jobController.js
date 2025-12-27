import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import { notificationService } from "../services/notificationService.js";
import logger from "../utils/logger.js";

export const createJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        console.log('[DEBUG] createJob req.body:', req.body);
        if (!userId) return res.status(401).json(formatResponse(false, "Unauthorized", null));

        const {
            title,
            description,
            budget_min,
            budget_max,
            location,
            trade_type,
            requirements,
            images,
            start_date,
            end_date
        } = req.body;

        if (!title || !description) {
            return res.status(400).json(formatResponse(false, "Title and description are required", null));
        }

        const finalTradeType = trade_type || req.body.category || 'All';
        const finalRequirements = requirements || {};
        const finalLocation = location && location.trim() !== '' ? location : 'Location Not Specified';

        const jobData = {
            projects_manager_id: userId,
            title,
            descriptions: description,
            budget_min: budget_min || 0,
            budget_max: budget_max || 0,
            locations: finalLocation, // FIXED: Database column is 'locations' (plural)
            trade_type: finalTradeType,
            requirements: finalRequirements,
            images: images || [],
            start_date: (start_date && !isNaN(Date.parse(start_date))) ? start_date : null,
            end_date: (end_date && !isNaN(Date.parse(end_date))) ? end_date : null,
            status: 'open'
        };

        console.log('[DEBUG] Inserting job with data:', JSON.stringify(jobData, null, 2));

        const { data, error } = await supabase
            .from("jobs")
            .insert(jobData)
            .select()
            .single();

        if (error) {
            logger.error('createJob DB Error:', error);
            console.error('[ERROR] Job creation failed:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        // Notify PM that job is posted
        try {
            await notificationService.send(userId, "Job Posted", `Your job "${title}" is now live and accepting applications.`, "success");
        } catch (nErr) {
            logger.error('Notification failed:', nErr);
        }

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

        // Use column-based join for robustness
        let query = supabase
            .from("jobs")
            .select(`
                *,
                project_manager:users(id, first_name, last_name, avatar_url, trust_score)
            `, { count: 'exact' })
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (search) query = query.ilike('title', `%${search}%`);
        if (trade_type) query = query.eq('trade_type', trade_type);
        if (location) query = query.ilike('locations', `%${location}%`);
        if (min_budget) query = query.gte('budget_min', min_budget);
        if (max_budget) query = query.lte('budget_max', max_budget);

        const { data, count, error } = await query;

        if (error) {
            logger.error('Get jobs error:', error);
            // Fallback: fetch without join
            const { data: fallbackData, count: fallbackCount, error: fError } = await supabase
                .from("jobs")
                .select("*", { count: 'exact' })
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (fError) throw fError;
            return res.json(formatResponse(true, "Jobs retrieved (minimal)", { jobs: fallbackData, total: fallbackCount }));
        }

        // Fetch application counts for the jobs
        if (data && data.length > 0) {
            const jobIds = data.map(j => j.id);
            const { data: counts } = await supabase
                .from('job_applications')
                .select('job_id')
                .in('job_id', jobIds);

            if (counts) {
                const countMap = counts.reduce((acc, curr) => {
                    acc[curr.job_id] = (acc[curr.job_id] || 0) + 1;
                    return acc;
                }, {});
                data.forEach(j => {
                    j.application_count = countMap[j.id] || 0;
                    j.applications_count = j.application_count; // Both variants
                    j.description = j.descriptions; // Alias
                    j.location = j.locations; // Alias
                });
            }
        }

        return res.json(formatResponse(true, "Jobs retrieved", { jobs: data, total: count, page: parseInt(page), pages: Math.ceil(count / limit) }));
    } catch (err) {
        logger.error('getJobs global Error:', err);
        console.error('[DEBUG] getJobs CRITICAL Error:', err);
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
                project_manager:users(id, first_name, last_name, avatar_url, trust_score, created_at)
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            logger.error("getJobById Error:", error);

            // Fallback: minimal details
            const { data: fallback, error: fError } = await supabase.from("jobs").select("*").eq("id", id).single();
            if (fError || !fallback) return res.status(404).json(formatResponse(false, "Job not found", null));

            return res.json(formatResponse(true, "Job details retrieved (minimal)", fallback));
        }

        if (data) {
            data.description = data.descriptions;
            data.location = data.locations;
        }

        return res.json(formatResponse(true, "Job details retrieved", data));
    } catch (err) {
        logger.error('getJobById global error:', err);
        console.error('[DEBUG] getJobById CRITICAL error:', err);
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

        let query = supabase.from("job_applications").select(`
            *,
            contractor:users!job_applications_contractor_id_fkey(id, first_name, last_name, avatar_url, trust_score)
        `).eq("job_id", id);

        // Filter: Admin/Owner sees all, Contractor only sees their own
        if (job.projects_manager_id !== userId && req.user.role !== 'admin') {
            query = query.eq("contractor_id", userId);
        }

        const { data: applications, error } = await query.order("created_at", { ascending: false });

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
