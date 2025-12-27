import { supabase } from '../config/supabaseClient.js';
import logger from '../utils/logger.js';

// Create a new milestone
export const createMilestone = async (req, res) => {
    try {
        const {
            project_id,
            title,
            amount,
            due_date,
            status = 'pending',
        } = req.body;

        // Validation
        if (!project_id || !title) {
            return res.status(400).json({
                success: false,
                message: 'Project ID and title are required',
            });
        }

        // Verify project exists and user has access
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', project_id)
            .single();

        if (projectError || !project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Create milestone
        const { data: milestone, error } = await supabase
            .from('milestones')
            .insert([
                {
                    project_id,
                    title,
                    amount: amount || 0,
                    due_date,
                    status,
                },
            ])
            .select()
            .single();

        if (error) {
            logger.error('Error creating milestone:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create milestone',
                error: error.message,
            });
        }

        logger.info(`Milestone created: ${milestone.id} for project: ${project_id} `);

        res.status(201).json({
            success: true,
            message: 'Milestone created successfully',
            data: milestone,
        });
    } catch (error) {
        logger.error('Create milestone error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Get all milestones (with optional project filter)
export const getMilestones = async (req, res) => {
    try {
        const { project_id, status } = req.query;

        let query = supabase
            .from('milestones')
            .select('*, projects(title, status)');

        if (project_id) {
            query = query.eq('project_id', project_id);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: milestones, error } = await query.order('due_date', { ascending: true });

        if (error) {
            logger.error('Error fetching milestones:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch milestones',
                error: error.message,
            });
        }

        res.json({
            success: true,
            message: 'Milestones retrieved successfully',
            data: milestones,
        });
    } catch (error) {
        logger.error('Get milestones error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Get milestone by ID
export const getMilestoneById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: milestone, error } = await supabase
            .from('milestones')
            .select('*, projects(title, status, owner_id)')
            .eq('id', id)
            .single();

        if (error || !milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found',
            });
        }

        res.json({
            success: true,
            message: 'Milestone retrieved successfully',
            data: milestone,
        });
    } catch (error) {
        logger.error('Get milestone error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Update milestone
export const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates.id;
        delete updates.created_at;
        delete updates.created_by;
        delete updates.project_id;

        const { data: milestone, error } = await supabase
            .from('milestones')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Error updating milestone:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update milestone',
                error: error.message,
            });
        }

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found',
            });
        }

        logger.info(`Milestone updated: ${id} `);

        res.json({
            success: true,
            message: 'Milestone updated successfully',
            data: milestone,
        });
    } catch (error) {
        logger.error('Update milestone error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Delete milestone
export const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: milestone, error } = await supabase
            .from('milestones')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Error deleting milestone:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete milestone',
                error: error.message,
            });
        }

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found',
            });
        }

        logger.info(`Milestone deleted: ${id} `);

        res.json({
            success: true,
            message: 'Milestone deleted successfully',
            data: milestone,
        });
    } catch (error) {
        logger.error('Delete milestone error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

// Complete milestone
export const completeMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { completion_notes } = req.body;

        const { data: milestone, error } = await supabase
            .from('milestones')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                completion_notes,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Error completing milestone:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to complete milestone',
                error: error.message,
            });
        }

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: 'Milestone not found',
            });
        }

        logger.info(`Milestone completed: ${id} `);

        res.json({
            success: true,
            message: 'Milestone marked as completed',
            data: milestone,
        });
    } catch (error) {
        logger.error('Complete milestone error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};
