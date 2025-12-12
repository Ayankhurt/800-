import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// ==================== JOBS MANAGEMENT ====================

export const getJobDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('jobs')
            .select(`
        *,
        created_by_user:users!jobs_created_by_fkey(id, email, first_name, last_name, avatar_url)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Job details retrieved", data));
    } catch (err) {
        console.error('Get job details error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobApplications = async (req, res) => {
    try {
        const { id } = req.params;

        // Get bids for this job (bids are applications)
        const { data, error } = await supabase
            .from('bids')
            .select(`
        *,
        contractor:users!bids_contractor_id_fkey(id, email, first_name, last_name, avatar_url, rating)
      `)
            .eq('job_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Job applications retrieved", data || []));
    } catch (err) {
        console.error('Get job applications error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobTimeline = async (req, res) => {
    try {
        const { id } = req.params;

        // Get activity timeline for the job
        const { data: job } = await supabase
            .from('jobs')
            .select('created_at, updated_at, status')
            .eq('id', id)
            .single();

        const { data: bids } = await supabase
            .from('bids')
            .select('created_at, status, contractor_id')
            .eq('job_id', id)
            .order('created_at', { ascending: true });

        // Create timeline events
        const timeline = [];

        if (job) {
            timeline.push({
                type: 'job_created',
                timestamp: job.created_at,
                description: 'Job posted'
            });

            if (job.updated_at !== job.created_at) {
                timeline.push({
                    type: 'job_updated',
                    timestamp: job.updated_at,
                    description: 'Job updated'
                });
            }
        }

        if (bids) {
            bids.forEach(bid => {
                timeline.push({
                    type: 'bid_received',
                    timestamp: bid.created_at,
                    description: `Bid received from contractor`,
                    contractor_id: bid.contractor_id
                });
            });
        }

        // Sort by timestamp
        timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return res.json(formatResponse(true, "Job timeline retrieved", timeline));
    } catch (err) {
        console.error('Get job timeline error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobAppointments = async (req, res) => {
    try {
        const { id } = req.params;

        // Get appointments related to this job
        const { data, error } = await supabase
            .from('appointments')
            .select(`
        *,
        client:users!appointments_client_id_fkey(id, email, first_name, last_name),
        contractor:users!appointments_contractor_id_fkey(id, email, first_name, last_name)
      `)
            .eq('job_id', id)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.warn('Appointments table may not exist:', error.message);
            return res.json(formatResponse(true, "Job appointments retrieved", []));
        }

        return res.json(formatResponse(true, "Job appointments retrieved", data || []));
    } catch (err) {
        console.error('Get job appointments error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==================== BIDS MANAGEMENT ====================

export const getAllBidsForAdmin = async (req, res) => {
    try {
        const { limit = 100, offset = 0, status, job_id } = req.query;

        let query = supabase
            .from('bids')
            .select(`
        *,
        job:jobs(id, title, budget, status),
        contractor:users!bids_contractor_id_fkey(id, email, first_name, last_name, avatar_url, rating)
      `, { count: 'exact' })
            .range(offset, offset + parseInt(limit) - 1)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (job_id) {
            query = query.eq('job_id', job_id);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Bids retrieved", {
            bids: data || [],
            total: count || 0
        }));
    } catch (err) {
        console.error('Get all bids error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
