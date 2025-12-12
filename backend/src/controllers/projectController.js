import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// PROJECTS
// ==========================================

export const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query = supabase
            .from("projects")
            .select(`
        *,
        owner:users!projects_owner_id_fkey (id, first_name, last_name, avatar_url),
        contractor:users!projects_contractor_id_fkey (id, first_name, last_name, avatar_url)
      `)
            .order("updated_at", { ascending: false });

        // Filter based on role
        if (['general_contractor', 'subcontractor', 'trade_specialist'].includes(role)) {
            query = query.eq("contractor_id", userId);
        } else {
            query = query.eq("owner_id", userId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return res.json(formatResponse(true, "Projects retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const createProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, budget, location, category, startDate, endDate, status } = req.body;

        const { data, error } = await supabase
            .from("projects")
            .insert({
                project_id: uuidv4(), // required by DB constraint
                owner_id: userId,
                title,
                description,
                budget,
                location,
                category,
                start_date: startDate,
                end_date: endDate,
                status: status || 'open'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Project created successfully", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        const { data: project } = await supabase.from("projects").select("owner_id").eq("id", id).single();

        if (!project) return res.status(404).json(formatResponse(false, "Project not found"));
        if (project.owner_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Unauthorized"));
        }

        const { data, error } = await supabase
            .from("projects")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Project updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const deleteProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data: project } = await supabase.from("projects").select("owner_id").eq("id", id).single();

        if (!project) return res.status(404).json(formatResponse(false, "Project not found"));
        if (project.owner_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Unauthorized"));
        }

        const { error } = await supabase.from("projects").delete().eq("id", id);
        if (error) throw error;

        return res.json(formatResponse(true, "Project deleted"));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getProjectById = async (req, res) => {

    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from("projects")
            .select(`
        *,
        owner:users!projects_owner_id_fkey (id, first_name, last_name, avatar_url, phone, email),
        contractor:users!projects_contractor_id_fkey (id, first_name, last_name, avatar_url, phone, email),
        milestones:project_milestones (*),
        change_orders:change_orders (*),
        progress_updates:progress_updates (*)
      `)
            .eq("id", id)
            .single();

        if (error || !data) return res.status(404).json(formatResponse(false, "Project not found", null));

        // Access control
        if (data.owner_id !== userId && data.contractor_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        return res.json(formatResponse(true, "Project details retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==========================================
// MILESTONES
// ==========================================

export const createMilestone = async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id } = req.params;
        const { title, description, payment_amount, due_date, deliverables, acceptance_criteria, order_number } = req.body;

        // Verify project ownership
        const { data: project } = await supabase.from("projects").select("owner_id, contractor_id").eq("id", project_id).single();
        if (!project) return res.status(404).json(formatResponse(false, "Project not found", null));

        if (project.owner_id !== userId && project.contractor_id !== userId) {
            return res.status(403).json(formatResponse(false, "Unauthorized", null));
        }

        const { data, error } = await supabase
            .from("project_milestones")
            .insert({
                project_id,
                title,
                description,
                payment_amount,
                due_date,
                deliverables: deliverables || [],
                acceptance_criteria: acceptance_criteria || [],
                status: 'pending',
                contractor_id: project.contractor_id,
                order_number: order_number || 1
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Milestone created", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateMilestoneStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        const { data: milestone } = await supabase
            .from("project_milestones")
            .select("*, project:projects(owner_id, contractor_id)")
            .eq("id", id)
            .single();

        if (!milestone) return res.status(404).json(formatResponse(false, "Milestone not found", null));

        const isOwner = milestone.project.owner_id === userId;
        const isContractor = milestone.project.contractor_id === userId;

        if (!isOwner && !isContractor) return res.status(403).json(formatResponse(false, "Unauthorized", null));

        // Logic checks
        if (isContractor && ['approved', 'rejected'].includes(status)) {
            return res.status(403).json(formatResponse(false, "Only owner can approve/reject milestones", null));
        }

        const updateData = { status };
        if (status === 'submitted') updateData.submitted_at = new Date();
        if (status === 'approved') {
            updateData.approved_at = new Date();
            updateData.approved_by = userId;
        }

        const { data, error } = await supabase
            .from("project_milestones")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Milestone updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==========================================
// CHANGE ORDERS
// ==========================================

export const createChangeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id } = req.params;
        const { title, description, cost_impact, timeline_impact_days, milestone_id } = req.body;

        const { data: project } = await supabase.from("projects").select("owner_id, contractor_id").eq("id", project_id).single();
        if (!project) return res.status(404).json(formatResponse(false, "Project not found", null));

        const requested_to = (userId === project.owner_id) ? project.contractor_id : project.owner_id;

        const { data, error } = await supabase
            .from("change_orders")
            .insert({
                project_id,
                milestone_id,
                requested_by: userId,
                requested_to,
                title,
                description,
                cost_impact,
                timeline_impact_days,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Change order requested", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const respondToChangeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status, rejected_reason } = req.body; // 'approved', 'rejected'

        const { data: co } = await supabase.from("change_orders").select("*").eq("id", id).single();
        if (!co) return res.status(404).json(formatResponse(false, "Change order not found", null));

        if (co.requested_to !== userId) {
            return res.status(403).json(formatResponse(false, "Unauthorized to respond", null));
        }

        const updateData = { status };
        if (status === 'approved') {
            updateData.approved_at = new Date();
            updateData.approved_by = userId;
        }
        if (status === 'rejected') {
            updateData.rejected_reason = rejected_reason;
        }

        const { data, error } = await supabase
            .from("change_orders")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, `Change order ${status}`, data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==========================================
// PROGRESS UPDATES
// ==========================================

export const createProgressUpdate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id } = req.params;
        const { milestone_id, update_type, work_completed, work_planned, issues, photos, gps_location } = req.body;

        const { data, error } = await supabase
            .from("progress_updates")
            .insert({
                project_id,
                milestone_id,
                contractor_id: userId,
                update_type: update_type || 'daily',
                work_completed,
                work_planned,
                issues,
                photos: photos || [],
                gps_location,
                created_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Progress update submitted", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getProgressUpdates = async (req, res) => {
    try {
        const { project_id } = req.params;
        const { data, error } = await supabase
            .from("progress_updates")
            .select("*")
            .eq("project_id", project_id)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return res.json(formatResponse(true, "Progress updates retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

