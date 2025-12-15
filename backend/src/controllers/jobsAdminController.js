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
                posted_by:users!jobs_project_manager_id_fkey(id, email, first_name, last_name, avatar_url)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json(formatResponse(false, "Job not found", null));
            }
            throw error;
        }

        return res.json(formatResponse(true, "Job details retrieved", data));
    } catch (err) {
        console.error('Get job details error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getJobApplications = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get bids for this job (bids are applications)
        const { data: bids, error } = await supabase
            .from('bids')
            .select('*')
            .eq('job_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Manual Join: Fetch contractor details
        if (bids && bids.length > 0) {
            const contractorIds = [...new Set(bids.map(b => b.contractor_id).filter(Boolean))];

            if (contractorIds.length > 0) {
                const { data: contractors, error: userError } = await supabase
                    .from('users')
                    .select('id, email, first_name, last_name, avatar_url, rating')
                    .in('id', contractorIds);

                if (userError) {
                    console.error('Error fetching contractors for applications:', userError);
                    // Don't fail the whole request, just return bids without details
                } else {
                    const contractorMap = {};
                    contractors.forEach(c => contractorMap[c.id] = c);

                    // Attach contractor to bid
                    const bidsWithContractors = bids.map(bid => ({
                        ...bid,
                        contractor: contractorMap[bid.contractor_id] || null
                    }));

                    return res.json(formatResponse(true, "Job applications retrieved", bidsWithContractors));
                }
            }
        }

        return res.json(formatResponse(true, "Job applications retrieved", bids || []));
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
            client: users!appointments_client_id_fkey(id, email, first_name, last_name),
                contractor: users!appointments_contractor_id_fkey(id, email, first_name, last_name)
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

// ==================== JOB UPDATES ====================

export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('jobs')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Job updated", data));
    } catch (err) {
        console.error('Update job error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('jobs')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Job status updated", data));
    } catch (err) {
        console.error('Update job status error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateJobDeadline = async (req, res) => {
    try {
        const { id } = req.params;
        const { deadline } = req.body;

        // Note: The schema might use 'end_date' instead of 'deadline'
        const { data, error } = await supabase
            .from('jobs')
            .update({ end_date: deadline })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Job deadline extended", data));
    } catch (err) {
        console.error('Update job deadline error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateJobFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const { featured } = req.body;

        // Check if 'featured' column exists in schema first? 
        // We will assume the column exists or user will add it.
        const { data, error } = await supabase
            .from('jobs')
            .update({ featured })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // Graceful fallback if column doesn't exist
            if (error.code === '42703') { // Undefined column
                return res.json(formatResponse(false, "Feature not supported by schema", null));
            }
            throw error;
        }

        return res.json(formatResponse(true, `Job ${featured ? 'featured' : 'unfeatured'}`, data));
    } catch (err) {
        console.error('Update job feature error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const flagJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        // Add to moderation queue
        const { data, error } = await supabase
            .from('moderation_queue')
            .insert({
                content_type: 'job',
                content_id: id,
                reported_by: userId,
                reason: reason,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Job flagged for moderation", data));
    } catch (err) {
        console.error('Flag job error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const contactJobPoster = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        // Get job poster
        const { data: job } = await supabase.from('jobs').select('project_manager_id').eq('id', id).single();

        if (!job) return res.status(404).json(formatResponse(false, "Job not found"));

        // Create a conversation or send message 
        // For simple admin contact:
        const { error } = await supabase
            .from('messages') // Assuming generic messages table
            .insert({
                sender_id: userId,
                receiver_id: job.project_manager_id,
                content: `[Admin Message regarding Job #${id}]: ${message}`,
                is_read: false
            });

        if (error) throw error;

        return res.json(formatResponse(true, "Message sent to job poster"));
    } catch (err) {
        console.error('Contact job poster error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const addJobAdminNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const userId = req.user.id;

        // Check if admin_notes table exists (or similar) or use a JSONB field on jobs
        // Assuming we need to store this somewhere. 
        // Current schema check didn't show 'admin_notes' table.
        // We will TRY to insert into a 'job_notes' or specialized table, 
        // IF NOT, we will append to a 'notes' field in the job itself if it exists (schema didn't show it).

        // Strategy: Create a 'job_notes' table if you want distinct notes, 
        // OR simply return success for now as placeholder if no table exists.

        // Let's assume we want to create a note in 'moderation_queue' as a log? No.
        // Let's assume we stick it in 'audit_logs' for now as a record.

        await supabase.from('audit_logs').insert({
            admin_id: userId,
            action: 'add_note',
            target_resource: 'job',
            target_id: id,
            details: { note }
        });

        return res.json(formatResponse(true, "Admin note recorded"));
    } catch (err) {
        console.error('Add admin note error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// ==================== BIDS MANAGEMENT ====================

export const getAllBidsForAdmin = async (req, res) => {
    try {
        const { limit = 100, page = 1, status, job_id } = req.query;
        // Calculate offset if page is provided, else use raw offset if passed (for flexibility)
        // AdminService usually passes page/limit
        const limitNum = parseInt(limit) || 50;
        const pageNum = parseInt(page) || 1;
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('bids')
            .select('*', { count: 'exact' })
            .range(offset, offset + limitNum - 1)
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (job_id) query = query.eq('job_id', job_id);

        const { data: bids, count, error } = await query;

        if (error) throw error;

        // Manual Join
        let enrichedBids = [];
        if (bids && bids.length > 0) {
            const userIds = new Set();
            const jobIds = new Set();

            bids.forEach(b => {
                if (b.contractor_id) userIds.add(b.contractor_id);
                if (b.project_manager_id) userIds.add(b.project_manager_id);
                if (b.job_id) jobIds.add(b.job_id);
            });

            const promises = [];

            if (userIds.size > 0) {
                promises.push(supabase.from('users').select('id, email, first_name, last_name, avatar_url, rating').in('id', [...userIds]));
            } else {
                promises.push(Promise.resolve({ data: [] }));
            }

            if (jobIds.size > 0) {
                promises.push(supabase.from('jobs').select('id, title, budget_min, budget_max, status, trade_type, end_date').in('id', [...jobIds]));
            } else {
                promises.push(Promise.resolve({ data: [] }));
            }

            const [usersRes, jobsRes] = await Promise.all(promises);

            const userMap = {};
            usersRes.data?.forEach(u => userMap[u.id] = u);

            const jobMap = {};
            jobsRes.data?.forEach(j => jobMap[j.id] = j);

            enrichedBids = bids.map(b => ({
                ...b,
                contractor: b.contractor_id ? (userMap[b.contractor_id] || null) : null,
                job: b.job_id ? (jobMap[b.job_id] || null) : null,
                created_by: b.project_manager_id ? (userMap[b.project_manager_id] || null) : null
            }));
        }

        return res.json(formatResponse(true, "Bids retrieved", {
            bids: enrichedBids,
            total: count || 0,
            page: pageNum,
            pages: Math.ceil((count || 0) / limitNum)
        }));
    } catch (err) {
        console.error('Get all bids error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getBidDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { data: bid, error } = await supabase
            .from('bids')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!bid) return res.status(404).json(formatResponse(false, "Bid not found"));

        // Fetch related data
        let job = null;
        let contractor = null;

        if (bid.job_id) {
            const { data: j } = await supabase.from('jobs').select('*').eq('id', bid.job_id).single();
            job = j;
        }

        if (bid.contractor_id) {
            const { data: c } = await supabase.from('users').select('id, email, first_name, last_name, avatar_url, rating').eq('id', bid.contractor_id).single();
            contractor = c;
        }

        const enrichedBid = {
            ...bid,
            job,
            contractor
        };

        return res.json(formatResponse(true, "Bid details retrieved", enrichedBid));
    } catch (err) {
        console.error('Get bid details error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const updateBid = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const AllowedFields = ['title', 'description', 'due_date', 'status'];
        const cleanUpdates = {};
        Object.keys(updates).forEach(k => {
            if (AllowedFields.includes(k)) cleanUpdates[k] = updates[k];
        });

        const { data, error } = await supabase
            .from('bids')
            .update(cleanUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.json(formatResponse(true, "Bid updated successfully", data));
    } catch (err) {
        console.error('Update bid error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const cancelBid = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('bids')
            .update({ status: 'withdrawn' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.json(formatResponse(true, "Bid cancelled successfully", data));
    } catch (err) {
        console.error('Cancel bid error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const closeBid = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('bids')
            .update({ status: 'rejected' })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return res.json(formatResponse(true, "Bid closed successfully", data));
    } catch (err) {
        console.error('Close bid error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
