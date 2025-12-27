import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Apply to a job
export const applyToJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            job_id,
            cover_letter,
            proposed_rate,
            available_start_date,
            portfolio_links,
            // Additional fields from various frontend versions
            resume_url,
            available_from,
            coverLetter
        } = req.body;

        const finalCoverLetter = cover_letter || coverLetter;
        const finalStartDate = available_start_date || available_from;
        const finalAttachments = portfolio_links || (resume_url ? [resume_url] : []);

        if (!job_id || !finalCoverLetter) {
            return res.status(400).json(formatResponse(false, "Job ID and cover letter required", null));
        }

        console.log("[DEBUG] applyToJob req.body:", req.body);

        // Get job details to find the owner/project manager
        const { data: job, error: jobError } = await supabase
            .from("jobs")
            .select("projects_manager_id")
            .eq("id", job_id)
            .single();

        if (jobError || !job) {
            console.error("[DEBUG] applyToJob Job Fetch Error:", jobError);
            return res.status(404).json(formatResponse(false, "Job not found", null));
        }

        const ownerId = job.projects_manager_id;

        // Check if already applied
        const { data: existing, error: checkError } = await supabase
            .from("job_applications")
            .select("id")
            .eq("job_id", job_id)
            .eq("contractor_id", userId)
            .maybeSingle();

        if (checkError) {
            console.error("[DEBUG] applyToJob Check Error:", checkError);
            throw checkError;
        }

        if (existing) {
            return res.status(400).json(formatResponse(false, "You have already applied to this job", null));
        }

        const { data, error } = await supabase
            .from("job_applications")
            .insert({
                job_id,
                contractor_id: userId,
                cover_letter: finalCoverLetter,
                proposed_rate: proposed_rate || 0,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error("[DEBUG] applyToJob Insert Error:", error);
            throw error;
        }

        return res.status(201).json(formatResponse(true, "Application submitted successfully", data));
    } catch (err) {
        console.error("[DEBUG] applyToJob Global Catch:", err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get applications for a job (job owner only)
export const getJobApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_id } = req.params;

        // Verify job ownership
        const { data: job } = await supabase
            .from("jobs")
            .select("projects_manager_id")
            .eq("id", job_id)
            .single();

        if (!job) {
            return res.status(404).json(formatResponse(false, "Job not found", null));
        }

        if (job.projects_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        // Fetch applications raw
        const { data: applications, error } = await supabase
            .from("job_applications")
            .select("*")
            .eq("job_id", job_id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Manual Join for Contractors
        let enrichedApplications = [];
        if (applications && applications.length > 0) {
            const contractorIds = [...new Set(applications.map(app => app.contractor_id))];

            const { data: contractors } = await supabase
                .from("users")
                .select("id, first_name, last_name, email, avatar_url, company_name, trust_score")
                .in("id", contractorIds);

            // Create map
            const contractorMap = {};
            if (contractors) {
                contractors.forEach(c => contractorMap[c.id] = c);
            }

            enrichedApplications = applications.map(app => ({
                ...app,
                contractor: contractorMap[app.contractor_id] || null
            }));
        }

        return res.json(formatResponse(true, "Applications retrieved", enrichedApplications));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get my applications (contractor)
export const getMyApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = supabase
            .from("job_applications")
            .select(`
        *,
        job:jobs!job_applications_job_id_fkey (id, title, locations, budget_min, budget_max, status)
      `)
            .eq("contractor_id", userId)
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "My applications retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update application status (job owner)
export const updateApplicationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!['accepted', 'rejected', 'reviewed'].includes(status)) {
            return res.status(400).json(formatResponse(false, "Invalid status", null));
        }

        // Get application first
        const { data: application } = await supabase
            .from("job_applications")
            .select("*")
            .eq("id", id)
            .single();

        if (!application) {
            return res.status(404).json(formatResponse(false, "Application not found", null));
        }

        // Get job to verify ownership
        const { data: job } = await supabase
            .from("jobs")
            .select("projects_manager_id")
            .eq("id", application.job_id)
            .single();

        if (!job) {
            return res.status(404).json(formatResponse(false, "Job not found", null));
        }

        if (job.projects_manager_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        const { data, error } = await supabase
            .from("job_applications")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, `Application ${status}`, data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Withdraw application
export const withdrawApplication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data: application } = await supabase
            .from("job_applications")
            .select("contractor_id, status")
            .eq("id", id)
            .single();

        if (!application) {
            return res.status(404).json(formatResponse(false, "Application not found", null));
        }

        if (application.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        if (application.status !== 'pending') {
            return res.status(400).json(formatResponse(false, "Cannot withdraw processed application", null));
        }

        const { error } = await supabase
            .from("job_applications")
            .update({ status: 'withdrawn' })
            .eq("id", id);

        if (error) throw error;

        return res.json(formatResponse(true, "Application withdrawn", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
