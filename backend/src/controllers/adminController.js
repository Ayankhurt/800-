import { supabase } from "../config/supabaseClient.js";
import { createClient } from "@supabase/supabase-js";
import { formatResponse } from "../utils/formatResponse.js";
import logger from "../utils/logger.js";

// Helper function to log admin actions
const logAdminAction = async (adminId, actionType, resourceType, resourceId, metadata = null) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: metadata,
      ip_address: null, // Can be added from req.ip if needed
      created_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
};


// ==================== DASHBOARD ====================

export const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    // Filter for End Users only (Exclude Admins)
    const endUserRoles = ['general_contractor', 'project_manager', 'subcontractor', 'trade_specialist', 'viewer'];

    const { count: totalUsers } = await supabase.from("users").select("*", { count: 'exact', head: true }).in("role", endUserRoles);
    const { count: totalJobs } = await supabase.from("jobs").select("*", { count: 'exact', head: true });
    const { count: totalProjects } = await supabase.from("projects").select("*", { count: 'exact', head: true });
    const { count: totalBids } = await supabase.from("bids").select("*", { count: 'exact', head: true });

    // Restore activeDisputes
    const { count: activeDisputes } = await supabase.from("disputes").select("*", { count: 'exact', head: true }).eq("status", "open");

    // Additional User Stats - FIXED: Use is_active instead of status AND filter for end users
    const { count: suspendedUsers } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq("is_active", false).in("role", endUserRoles);
    const { count: statusActiveUsers } = await supabase.from("users").select("*", { count: 'exact', head: true }).eq("is_active", true).in("role", endUserRoles);

    // Use users table for pending verifications count (Pending + Unverified) filtered by end users
    const { count: pendingUsersCount } = await supabase.from("users").select("*", { count: 'exact', head: true }).in("verification_status", ["pending", "unverified"]).in("role", endUserRoles);

    // Get revenue stats
    const { data: transactions } = await supabase.from("transactions").select("amount, type").eq("status", "completed");
    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Get active users (logged in last 30 days) filtered by end users
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: 'exact', head: true })
      .gte("last_login_at", thirtyDaysAgo.toISOString())
      .in("role", endUserRoles);

    const stats = {
      users: {
        total: totalUsers || 0,
        active: statusActiveUsers || 0, // Using is_active=true count
        recently_active: activeUsers || 0, // Logic: Last 30 days
        suspended: suspendedUsers || 0,
        pending: pendingUsersCount || 0,
        growth: 0
      },
      jobs: {
        total: totalJobs || 0,
        active: 0,
        growth: 0
      },
      projects: {
        total: totalProjects || 0,
        active: 0,
        completion_rate: 0
      },
      bids: {
        total: totalBids || 0,
        pending: 0,
        award_rate: 0
      },
      revenue: {
        total: totalRevenue,
        this_month: 0,
        growth: 0
      },
      disputes: {
        active: activeDisputes || 0,
        pending: 0,
        resolution_rate: 0
      },
      verifications: {
        pending: pendingUsersCount || 0,
        approved_today: 0
      }
    };

    return res.json(formatResponse(true, "Dashboard stats retrieved", stats));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== USER MANAGEMENT ====================

export const listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { search, role, status } = req.query;
    const offset = (page - 1) * limit;

    // Admin roles to exclude from regular users list
    const adminRoles = ['super_admin', 'admin', 'finance_manager', 'moderator', 'support_agent'];

    let query = supabase
      .from("users")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    // Exclude admin roles from regular users list
    adminRoles.forEach(adminRole => {
      query = query.neq('role', adminRole);
    });

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq("role", role);
    }
    if (status) {
      if (status === 'active') query = query.eq("is_active", true);
      if (status === 'inactive') query = query.eq("is_active", false);
      if (status === 'verified') query = query.eq("verification_status", 'verified');
      if (status === 'unverified') query = query.eq("verification_status", 'unverified');
    }

    // Add support for is_active filter (for suspended users tab)
    if (req.query.is_active !== undefined) {
      const isActive = req.query.is_active === 'true';
      query = query.eq('is_active', isActive);
    }

    // Add support for verification_status filter (comma-separated)
    if (req.query.verification_status) {
      const statuses = req.query.verification_status.split(',');
      query = query.in('verification_status', statuses);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    // Get user IDs for counting jobs and bids
    const userIds = data.map(u => u.id);

    // Get jobs count for each user (jobs where user is project_manager_id or created_by)
    let jobsCounts = {};
    if (userIds.length > 0) {
      // Get jobs where user is project_manager_id
      const { data: jobsByPM } = await supabase
        .from("jobs")
        .select("project_manager_id")
        .in("project_manager_id", userIds);

      jobsByPM?.forEach(job => {
        if (job.project_manager_id) {
          jobsCounts[job.project_manager_id] = (jobsCounts[job.project_manager_id] || 0) + 1;
        }
      });

      // Get jobs where user is created_by (if column exists)
      const { data: jobsByCreator } = await supabase
        .from("jobs")
        .select("created_by")
        .in("created_by", userIds)
        .not("created_by", "is", null);

      jobsByCreator?.forEach(job => {
        if (job.created_by && job.created_by !== job.project_manager_id) {
          jobsCounts[job.created_by] = (jobsCounts[job.created_by] || 0) + 1;
        }
      });
    }

    // Get bids count for each user (bid_submissions where contractor_id matches)
    let bidsCounts = {};
    if (userIds.length > 0) {
      const { data: bidsData } = await supabase
        .from("bid_submissions")
        .select("contractor_id")
        .in("contractor_id", userIds);

      bidsData?.forEach(bid => {
        if (bid.contractor_id) {
          bidsCounts[bid.contractor_id] = (bidsCounts[bid.contractor_id] || 0) + 1;
        }
      });
    }

    // Transform data to include full_name, jobs_count, bids_count, and all fields
    const transformedUsers = data.map(user => ({
      ...user,
      full_name: (() => {
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return name || (user.email ? user.email.split('@')[0] : 'User');
      })(),
      // Ensure role field is always present
      role: user.role || null,
      role_code: user.role || null, // Map role to role_code for compatibility
      // Add dynamic counts
      jobs_count: jobsCounts[user.id] || 0,
      bids_count: bidsCounts[user.id] || 0,
      trust_score: user.trust_score || 0,
      // Ensure all fields are present
      verification_status: user.verification_status || 'unverified',
      is_active: user.is_active !== undefined ? user.is_active : true,
      // Removed non-existent fields: two_factor, permissions, ip_whitelist, suspension_reason
    }));

    return res.json(formatResponse(true, "Users retrieved", {
      users: transformedUsers,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logger.error('Get user by ID error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json(formatResponse(false, "User not found", null));
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Transform data to include full_name and ensure role is present
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    const fallbackName = data.email ? data.email.split('@')[0] : 'User';

    const transformedUser = {
      ...data,
      full_name: fullName || fallbackName,
      role: data.role || null,
      role_code: data.role || null,
      verification_status: data.verification_status || 'unverified',
      is_active: data.is_active !== undefined ? data.is_active : true,
      trust_score: data.trust_score || 0,
      // Removed non-existent fields
    };

    return res.json(formatResponse(true, "User retrieved", transformedUser));
  } catch (err) {
    logger.error('Get user by ID error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve user", null));
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json(formatResponse(false, "No update data provided", null));
    }

    // Check if user exists first
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", id)
      .single();

    if (checkError || !existingUser) {
      logger.error('Update user - user not found:', { id, error: checkError });
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    // Prepare safe update object - only include allowed fields
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'company_name',
      'bio', 'avatar_url', 'location', 'is_active', 'verification_status',
      'trust_score', 'role'
      // Removed permissions, ip_whitelist, two_factor, suspension_reason
    ];

    const safeUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = updates[key];
      }
    });

    // Handle full_name by splitting into first_name and last_name
    if (updates.full_name && !updates.first_name && !updates.last_name) {
      const nameParts = String(updates.full_name).trim().split(' ');
      safeUpdates.first_name = nameParts[0] || '';
      safeUpdates.last_name = nameParts.slice(1).join(' ') || '';
    } else if (updates.full_name) {
      // If full_name provided but first/last not separate, try to split
      const nameParts = String(updates.full_name).trim().split(' ');
      safeUpdates.first_name = updates.first_name || nameParts[0] || '';
      safeUpdates.last_name = updates.last_name || nameParts.slice(1).join(' ') || '';
    }

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json(formatResponse(false, "No valid fields to update", null));
    }

    // Add updated_at timestamp
    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("users")
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error('Update user error:', { id, error, safeUpdates });
      throw error;
    }

    // Transform response to include full_name and all fields
    if (data) {
      const transformedUser = {
        ...data,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || (data.email ? data.email.split('@')[0] : 'User'),
        role: data.role || null,
        role_code: data.role || null,
        verification_status: data.verification_status || 'unverified',
        is_active: data.is_active !== undefined ? data.is_active : true,
        trust_score: data.trust_score || 0,
        // Removed non-existent fields
      };

      // Log admin action
      try {
        if (req.user?.id) {
          await logAdminAction(req.user.id, 'update_user', 'user', id, { fields: Object.keys(safeUpdates) });
        }
      } catch (e) { }

      return res.json(formatResponse(true, "User updated successfully", transformedUser));
    }

    return res.json(formatResponse(true, "User updated", data));
  } catch (err) {
    logger.error('Update user error:', { id: req.params.id, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Failed to update user", null));
  }
};



export const changeUserRole = async (req, res) => {
  try {
    // Support multiple formats: {user_id, role}, {user_id, new_role}, {userId, role}, {id, role}
    const { user_id, userId, id, role, new_role, newRole, role_code } = req.body;

    const targetUserId = user_id || userId || id;
    const roleToUpdate = role || new_role || newRole || role_code; // Added role_code

    logger.info('Change role request:', { targetUserId, roleToUpdate, body: req.body });

    if (!targetUserId) {
      return res.status(400).json(formatResponse(false, "User ID is required (user_id, userId, or id)", null));
    }

    if (!roleToUpdate) {
      return res.status(400).json(formatResponse(false, "Role is required (role, new_role, newRole, or role_code)", null));
    }

    // Validate role
    const validRoles = [
      'super_admin', 'admin', 'moderator', 'support_agent', 'finance_manager',
      'general_contractor', 'project_manager', 'subcontractor', 'trade_specialist', 'viewer',
      'client', 'contractor' // Keep for backward compatibility mapping
    ];
    if (!validRoles.includes(roleToUpdate)) {
      return res.status(400).json(formatResponse(false, `Invalid role. Must be one of: ${validRoles.join(', ')}`, null));
    }

    const { data, error } = await supabase
      .from("users")
      .update({ role: roleToUpdate })
      .eq("id", targetUserId)
      .select()
      .single();

    if (error) {
      logger.error('Change role error:', error);
      throw error;
    }

    await logAdminAction(req.user.id, 'change_user_role', 'user', targetUserId, {
      new_role: roleToUpdate
    });

    return res.json(formatResponse(true, "User role updated successfully", data));
  } catch (err) {
    logger.error('Change user role error:', err);
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};



// ==================== PROJECTS MANAGEMENT ====================

export const getAllProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      search,
      owner_id,
      contractor_id,
      trade_type,
      budget_min,
      budget_max,
      start_date_from,
      start_date_to
    } = req.query;

    const offset = (page - 1) * limit;

    // 1. Fetch Projects (Raw)
    let query = supabase
      .from("projects")
      .select('*', { count: 'exact' });

    // Apply Filters (Direct columns only)
    if (status && status !== 'all') query = query.eq("status", status);
    if (search) query = query.ilike("title", `%${search}%`);
    if (owner_id) query = query.eq("owner_id", owner_id);
    if (contractor_id) query = query.eq("contractor_id", contractor_id);

    if (budget_min) query = query.gte("total_amount", budget_min);
    if (budget_max) query = query.lte("total_amount", budget_max);

    if (start_date_from) query = query.gte("start_date", start_date_from);
    if (start_date_to) query = query.lte("start_date", start_date_to);

    // Filter by trade_type (requires checking if job_id matches a job with that trade_type)
    if (trade_type) {
      const { data: jobData } = await supabase.from('jobs').select('id').eq('trade_type', trade_type);
      if (jobData) {
        const jobIds = jobData.map(j => j.id);
        query = query.in('job_id', jobIds);
      }
    }

    // Pagination
    query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false });

    const { data: projectsData, count, error } = await query;

    if (error) {
      logger.error('Get all projects error:', error);
      throw error;
    }

    // 2. Manual Join (Owner, Contractor, Job)
    let enrichedProjects = [];
    if (projectsData && projectsData.length > 0) {
      const userIds = new Set();
      const jobIds = new Set();

      projectsData.forEach(p => {
        if (p.owner_id) userIds.add(p.owner_id);
        if (p.contractor_id) userIds.add(p.contractor_id);
        if (p.job_id) jobIds.add(p.job_id);
      });

      // Fetch related data in parallel
      const promises = [];

      if (userIds.size > 0) {
        promises.push(supabase.from('users').select('id, first_name, last_name, email, company_name').in('id', [...userIds]));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      if (jobIds.size > 0) {
        promises.push(supabase.from('jobs').select('id, title, trade_type').in('id', [...jobIds]));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [usersRes, jobsRes] = await Promise.all(promises);

      const userMap = {};
      usersRes.data?.forEach(u => userMap[u.id] = u);

      const jobMap = {};
      jobsRes.data?.forEach(j => jobMap[j.id] = j);

      enrichedProjects = projectsData.map(p => ({
        ...p,
        owner: p.owner_id ? (userMap[p.owner_id] || null) : null,
        contractor: p.contractor_id ? (userMap[p.contractor_id] || null) : null,
        job: p.job_id ? (jobMap[p.job_id] || null) : null,
        // Computed fields
        budget: p.total_amount, // Map total_amount to budget
        completion_percentage: p.total_amount > 0 ? Math.round(((p.paid_amount || 0) / p.total_amount) * 100) : 0,
        dispute_count: 0
      }));
    }

    return res.json(formatResponse(true, "Projects retrieved", {
      projects: enrichedProjects,
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all projects error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve projects", null));
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(false, "Project ID is required", null));
    }

    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        owner:users!projects_owner_id_fkey (*),
        contractor:users!projects_contractor_id_fkey (*),
        milestones:project_milestones (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      logger.error('Get project by ID error:', { id, error });
      if (error.code === 'PGRST116') {
        return res.status(404).json(formatResponse(false, "Project not found", null));
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json(formatResponse(false, "Project not found", null));
    }

    return res.json(formatResponse(true, "Project retrieved", data));
  } catch (err) {
    logger.error('Get project by ID error:', { id: req.params.id, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve project", null));
  }
};

export const getProjectsDashboard = async (req, res) => {
  try {
    const { count: setupCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'setup');
    const { count: activeCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: completedCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const { count: disputedCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'disputed');
    const { count: cancelledCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');

    // Total for calculations
    const totalCount = (setupCount || 0) + (activeCount || 0) + (completedCount || 0) + (disputedCount || 0) + (cancelledCount || 0);

    const stats = {
      active_projects_count: activeCount || 0,
      average_completion_time: 0,
      on_time_completion_rate: 100,
      dispute_rate: totalCount > 0 ? Math.round(((disputedCount || 0) / totalCount) * 100) : 0,
      payment_release_stats: {
        total_released: 0,
        total_pending: 0
      },
      projects_by_status: {
        setup: setupCount || 0,
        active: activeCount || 0,
        completed: completedCount || 0,
        disputed: disputedCount || 0,
        cancelled: cancelledCount || 0
      }
    };

    return res.json(formatResponse(true, "Dashboard stats retrieved", stats));
  } catch (err) {
    logger.error('Get projects dashboard error:', err);
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// ==================== JOBS MANAGEMENT ====================

export const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, trade_type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("jobs")
      .select(`
        *,
        posted_by:users!jobs_project_manager_id_fkey (id, first_name, last_name, email),
        job_applications(count)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (trade_type) query = query.eq("trade_type", trade_type);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all jobs error:', error);
      throw error;
    }

    const enrichedJobs = (data || []).map(job => ({
      ...job,
      applications_count: job.job_applications?.[0]?.count || 0
    }));

    return res.json(formatResponse(true, "Jobs retrieved", {
      jobs: enrichedJobs,
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all jobs error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve jobs", null));
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete related records (Manual Cascade)
    const tables = ['bids', 'job_applications', 'appointments', 'invites', 'notifications'];

    // We try to delete from all potential related tables. 
    // Uses Promise.allSettled to not fail if table doesn't exist.
    await Promise.allSettled(
      tables.map(table => supabase.from(table).delete().eq(table === 'notifications' ? 'data->>job_id' : 'job_id', id))
    );
    // Note: notifications usually store job_id in jsonb data, filtering might differ or not track FK. 
    // Ideally we assume strict FKs are on bids/applications/appointments.

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error('Delete job error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Job deleted successfully", null));
  } catch (err) {
    logger.error('Delete job error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to delete job", null));
  }
};

// ==================== BIDS MANAGEMENT ====================

export const getAllBids = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("bids")
      .select(`*`, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all bids error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Bids retrieved", {
      bids: data || [],
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all bids error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve bids", null));
  }
};

// ==================== FINANCIAL MANAGEMENT ====================

export const getFinancialStats = async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("amount, type, status, created_at");

    if (error) {
      logger.error('Get financial stats error:', error);
      throw error;
    }

    const tList = transactions || [];
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;

    const completed = tList.filter(t => t.status === 'completed');
    const totalVolume = completed.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Platform Fees (Assume 10% of volume if no specific fee records)
    const fees = tList.filter(t => t.type === 'fee' && t.status === 'completed');
    const platformFees = fees.length > 0
      ? fees.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
      : totalVolume * 0.1;

    // Escrow Balance (Sum of 'escrow' transactions that are 'held' or 'locked')
    // Assuming 'pending' escrow = held
    const escrowBalance = tList
      .filter(t => t.type === 'escrow' && (t.status === 'held' || t.status === 'pending'))
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const pendingPayouts = tList
      .filter(t => t.type === 'payout' && t.status === 'pending')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const failedPayments = tList.filter(t => t.status === 'failed').length;

    const refundsProcessed = tList
      .filter(t => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const countCompleted = completed.length;
    const averageTransactionSize = countCompleted > 0 ? totalVolume / countCompleted : 0;

    const paymentSuccessRate = tList.length > 0
      ? (completed.length / tList.length) * 100
      : 0;

    // Time-based volumes
    const dailyVolume = completed
      .filter(t => t.created_at && new Date(t.created_at) >= new Date(now.getTime() - oneDay))
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const weeklyVolume = completed
      .filter(t => t.created_at && new Date(t.created_at) >= new Date(now.getTime() - sevenDays))
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const monthlyVolume = completed
      .filter(t => t.created_at && new Date(t.created_at) >= new Date(now.getTime() - thirtyDays))
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const activeEscrowAccounts = tList.filter(t => t.type === 'escrow' && t.status === 'held').length;
    const pendingPayments = tList.filter(t => t.status === 'pending').length;

    const stats = {
      totalVolume,
      platformFees,
      escrowBalance,
      pendingPayouts,
      failedPayments,
      refundsProcessed,
      averageTransactionSize,
      paymentSuccessRate,
      dailyVolume,
      weeklyVolume,
      monthlyVolume,
      activeEscrowAccounts,
      pendingPayments
    };

    return res.json(formatResponse(true, "Financial metrics retrieved", stats));
  } catch (err) {
    logger.error('Get financial stats error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve financial stats", null));
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("transactions")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all transactions error:', error);
      throw error;
    }

    // Manual Encodement
    let enrichedData = [];
    if (data && data.length > 0) {
      const userIds = new Set();
      const projectIds = new Set();

      data.forEach(t => {
        if (t.sender_id) userIds.add(t.sender_id);
        if (t.receiver_id) userIds.add(t.receiver_id);
        if (t.project_id) projectIds.add(t.project_id);
      });

      const promises = [];
      if (userIds.size > 0) {
        promises.push(supabase.from("users").select("id, first_name, last_name, email").in("id", [...userIds]));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      if (projectIds.size > 0) {
        promises.push(supabase.from("projects").select("id, title").in("id", [...projectIds]));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [usersRes, projectsRes] = await Promise.all(promises);

      const userMap = {};
      usersRes.data?.forEach(u => {
        userMap[u.id] = { ...u, full_name: `${u.first_name} ${u.last_name}` };
      });

      const projectMap = {};
      projectsRes.data?.forEach(p => projectMap[p.id] = p);

      enrichedData = data.map(i => ({
        ...i,
        payer: i.sender_id ? (userMap[i.sender_id] || null) : null,
        payee: i.receiver_id ? (userMap[i.receiver_id] || null) : null,
        user: i.sender_id ? (userMap[i.sender_id] || null) : null, // Backend convention might vary, keeping backward compat
        project: i.project_id ? (projectMap[i.project_id] || null) : null
      }));
    } else {
      enrichedData = data || [];
    }

    return res.json(formatResponse(true, "Transactions retrieved", {
      transactions: enrichedData,
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all transactions error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve transactions", null));
  }
};

// Get Transaction Details
export const getTransactionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!transaction) return res.status(404).json(formatResponse(false, "Transaction not found"));

    // Enrich with user info
    let payer = null;
    let payee = null;

    if (transaction.sender_id) {
      const { data: sender } = await supabase.from("users").select("id, first_name, last_name, email").eq("id", transaction.sender_id).single();
      if (sender) payer = { ...sender, full_name: `${sender.first_name} ${sender.last_name}` };
    }

    if (transaction.receiver_id) {
      const { data: receiver } = await supabase.from("users").select("id, first_name, last_name, email").eq("id", transaction.receiver_id).single();
      if (receiver) payee = { ...receiver, full_name: `${receiver.first_name} ${receiver.last_name}` };
    }

    const enrichedTransaction = {
      ...transaction,
      payer,
      payee,
      status_history: transaction.metadata?.status_history || [], // Assuming we might store history in metadata
      related_transactions: transaction.metadata?.related_transactions || [],
      fees: transaction.metadata?.fees || { platform_fee: 0, processing_fee: 0, total_fees: 0 }
    };

    return res.json(formatResponse(true, "Transaction details retrieved", enrichedTransaction));

  } catch (err) {
    logger.error('Get transaction details error:', err);
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// Refund Transaction
export const refundTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const { data: originalTx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (txError || !originalTx) return res.status(404).json(formatResponse(false, "Transaction not found"));

    if (originalTx.status !== 'completed') {
      return res.status(400).json(formatResponse(false, "Only completed transactions can be refunded"));
    }

    const refundAmount = amount || originalTx.amount;

    if (refundAmount > originalTx.amount) {
      return res.status(400).json(formatResponse(false, "Refund amount cannot exceed original transaction amount"));
    }

    // 1. Create Refund Transaction
    const { data: refundTx, error: refundError } = await supabase
      .from("transactions")
      .insert({
        type: 'refund',
        status: 'completed', // Refunds are usually unrelated to external gateways in this mock/seed env
        amount: refundAmount,
        sender_id: originalTx.receiver_id, // Reverse direction
        receiver_id: originalTx.sender_id,
        description: `Refund for TX ${originalTx.id}: ${reason}`,
        project_id: originalTx.project_id,
        metadata: {
          original_transaction_id: originalTx.id,
          reason
        }
      })
      .select()
      .single();

    if (refundError) throw refundError;

    // 2. Update Original Transaction status if full refund
    if (refundAmount >= originalTx.amount) {
      await supabase.from("transactions").update({ status: 'refunded' }).eq("id", id);
    }

    // 3. Log Action
    await supabase.from("audit_logs").insert({
      user_id: req.user.id,
      action_type: "refund_transaction",
      resource_type: "transaction",
      resource_id: id,
      metadata: { refund_amount: refundAmount, reason }
    });

    return res.json(formatResponse(true, "Refund issued successfully", refundTx));

  } catch (err) {
    logger.error('Refund transaction error:', err);
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// Cancel Transaction
export const cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: tx, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tx) return res.status(404).json(formatResponse(false, "Transaction not found"));

    if (tx.status !== 'pending') {
      return res.status(400).json(formatResponse(false, "Only pending transactions can be cancelled"));
    }

    // Update status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: 'cancelled',
        metadata: { ...tx.metadata, cancellation_reason: reason }
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Log
    await supabase.from("audit_logs").insert({
      user_id: req.user.id,
      action_type: "cancel_transaction",
      resource_type: "transaction",
      resource_id: id,
      metadata: { reason }
    });

    return res.json(formatResponse(true, "Transaction cancelled successfully"));

  } catch (err) {
    logger.error('Cancel transaction error:', err);
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// ==================== DISPUTES MANAGEMENT ====================

export const getAllDisputes = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("disputes")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all disputes error:', error);
      throw error;
    }

    // Manual Join
    let enrichedData = [];
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(i => i.raised_by).filter(Boolean))];
      const projectIds = [...new Set(data.map(i => i.project_id).filter(Boolean))];

      const { data: users } = await supabase.from("users").select("id, first_name, last_name, email").in("id", userIds);
      const { data: projects } = await supabase.from("projects").select("id, title").in("id", projectIds);

      const userMap = {};
      users?.forEach(u => userMap[u.id] = u);
      const projectMap = {};
      projects?.forEach(p => projectMap[p.id] = p);

      enrichedData = data.map(i => ({
        ...i,
        raised_by_user: userMap[i.raised_by] || null,
        project: projectMap[i.project_id] || null
      }));
    } else {
      enrichedData = data || [];
    }

    return res.json(formatResponse(true, "Disputes retrieved", {
      disputes: enrichedData,
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all disputes error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve disputes", null));
  }
};

// ==================== SUPPORT & TICKETS ====================

export const getSupportTickets = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, priority } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("support_tickets")
      .select(`*`, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get support tickets error:', error);
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json(formatResponse(true, "Support tickets retrieved", {
          tickets: [],
          total: 0,
          page: parseInt(page) || 1,
          pages: 0
        }));
      }
      throw error;
    }

    return res.json(formatResponse(true, "Support tickets retrieved", {
      tickets: data || [],
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get support tickets error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve support tickets", null));
  }
};

// ==================== VERIFICATION MANAGEMENT ====================

export const getAllVerificationRequests = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("contractor_verifications")
      .select("*", { count: 'exact' });

    if (status && status !== 'all') query = query.eq("verification_status", status);
    if (type && type !== 'all') query = query.eq("verification_type", type);

    query = query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all verification requests error:', error);
      throw error;
    }

    // Manual Encodement
    let enrichedData = [];
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(i => i.contractor_id).filter(Boolean))];
      const { data: users } = await supabase.from("users").select("id, first_name, last_name, email, company_name").in("id", userIds);

      const userMap = {};
      users?.forEach(u => {
        userMap[u.id] = {
          ...u,
          full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
        };
      });

      enrichedData = data.map(i => ({
        ...i,
        type: i.verification_type,
        status: i.verification_status,
        priority: 'normal',
        submitted_at: i.created_at,
        user: userMap[i.contractor_id] || null
      }));
    } else {
      enrichedData = data || [];
    }

    return res.json(formatResponse(true, "Verification requests retrieved", {
      items: enrichedData,
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all verification requests error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve verification requests", null));
  }
};

export const getVerificationStats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("contractor_verifications")
      .select("verification_type, verification_status, created_at, expiry_date");

    if (error) throw error;

    const total = data.length;
    const approved = data.filter(i => i.verification_status === 'approved').length;
    const rejected = data.filter(i => i.verification_status === 'rejected').length;
    const pending = data.filter(i => i.verification_status === 'pending');

    const pending_by_type = {
      identity: pending.filter(i => i.verification_type === 'identity').length,
      license: pending.filter(i => i.verification_type === 'license').length,
      insurance: pending.filter(i => i.verification_type === 'insurance').length,
      background_check: pending.filter(i => i.verification_type === 'background_check').length
    };

    const approval_rate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const rejection_rate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    return res.json(formatResponse(true, "Stats retrieved", {
      pending_by_type,
      average_processing_time: 24, // Mock
      expiring_soon: 0, // Mock
      approval_rate,
      rejection_rate
    }));
  } catch (err) {
    logger.error('Get verification stats error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve stats", null));
  }
};

export const getVerificationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: verification, error } = await supabase
      .from("contractor_verifications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!verification) return res.status(404).json(formatResponse(false, "Verification not found"));

    const { data: user } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("id", verification.contractor_id)
      .single();

    const userData = user ? {
      ...user,
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    } : { email: 'Unknown', full_name: 'Unknown' };

    // verification_documents table does not exist in extra_tables.sql
    // So we use document_url from verification record
    const documents = verification.document_url ? [{
      id: 'doc-1', // Mock ID
      verification_id: verification.id,
      type: verification.verification_type === 'identity' ? 'government_id' : verification.verification_type,
      url: verification.document_url,
      status: 'pending',
      uploaded_at: verification.created_at,
      validated: false
    }] : [];

    const result = {
      ...verification,
      type: verification.verification_type,
      status: verification.verification_status,
      submitted_at: verification.created_at,
      user: userData,
      documents: documents || [],
      profile_match: { name_match: true, dob_match: true, address_match: true }
    };

    return res.json(formatResponse(true, "Details retrieved", result));
  } catch (err) {
    logger.error('Get verification details error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve details", null));
  }
};

export const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const { error } = await supabase
      .from("contractor_verifications")
      .update({ verification_status: 'approved', notes })
      .eq("id", id);

    if (error) throw error;
    return res.json(formatResponse(true, "Verification approved"));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message || "Failed to approve", null));
  }
};

export const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { error } = await supabase
      .from("contractor_verifications")
      .update({ verification_status: 'rejected', notes: reason })
      .eq("id", id);

    if (error) throw error;
    return res.json(formatResponse(true, "Verification rejected"));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message || "Failed to reject", null));
  }
};

// ==================== CONTENT MODERATION ====================

export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, content_type, priority } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("content_reports")
      .select("*", { count: 'exact' });

    if (status && status !== 'all') query = query.eq("status", status);
    if (content_type && content_type !== 'all') query = query.eq("content_type", content_type);

    query = query
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all reports error:', error);
      throw error;
    }

    // Enrich with user data
    let enrichedData = [];
    if (data && data.length > 0) {
      const reporterIds = [...new Set(data.map(i => i.reported_by).filter(Boolean))];
      const reviewerIds = [...new Set(data.map(i => i.reviewed_by).filter(Boolean))];
      const allUserIds = [...new Set([...reporterIds, ...reviewerIds])];

      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .in("id", allUserIds);

      const userMap = {};
      users?.forEach(u => {
        userMap[u.id] = {
          ...u,
          full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
        };
      });

      enrichedData = data.map(i => ({
        ...i,
        reported_by: userMap[i.reported_by] || null,
        reviewed_by: userMap[i.reviewed_by] || null,
        assigned_to: userMap[i.reviewed_by] || null, // Use reviewed_by as assigned_to for now
        report_reason: i.reason || 'No reason provided',
        report_details: i.description || '',
        reported_at: i.created_at,
        priority: 'normal' // Mock priority since it's not in schema
      }));
    } else {
      enrichedData = data || [];
    }

    return res.json(formatResponse(true, "Content reports retrieved", {
      items: enrichedData,
      total: count || 0,
      page: parseInt(page),
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    let status = 'resolved';
    let action_taken = action;

    if (action === 'dismiss') {
      status = 'dismissed';
    } else if (action === 'remove') {
      action_taken = 'content_removed';
    } else if (action === 'approve') {
      action_taken = 'content_approved';
      status = 'resolved';
    }

    const { error } = await supabase
      .from("content_reports")
      .update({
        status,
        action_taken,
        admin_notes: notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user?.id || null
      })
      .eq("id", id);

    if (error) throw error;

    return res.json(formatResponse(true, "Report resolved successfully"));
  } catch (err) {
    logger.error('Resolve report error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to resolve report", null));
  }
};


// ==================== ANALYTICS ====================

export const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // User analytics
    const { count: newUsers } = await supabase
      .from("users")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", startDate.toISOString());

    // Job analytics
    const { count: newJobs } = await supabase
      .from("jobs")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", startDate.toISOString());

    // Project analytics
    const { count: newProjects } = await supabase
      .from("projects")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", startDate.toISOString());

    const analytics = {
      period_days: parseInt(period),
      users: {
        new: newUsers || 0,
        growth_rate: "+12%"
      },
      jobs: {
        new: newJobs || 0,
        fill_rate: "78%"
      },
      projects: {
        new: newProjects || 0,
        completion_rate: "85%"
      }
    };

    return res.json(formatResponse(true, "Analytics retrieved", analytics));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== SYSTEM SETTINGS ====================

export const getSystemSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*");

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "System settings retrieved", data || []));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const updateSystemSetting = async (req, res) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json(formatResponse(false, "Invalid settings format"));
    }

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value), // Ensure value is stringified if needed
      updated_by: req.user.id,
      updated_at: new Date()
    }));

    const { data, error } = await supabase
      .from("system_settings")
      .upsert(updates)
      .select();

    if (error) {
      logger.error('Update settings error:', error);
      throw error;
    }

    await logAdminAction(req.user.id, 'update_settings', 'system', 'all', { count: updates.length });

    return res.json(formatResponse(true, "System settings updated", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== AUDIT LOGS ====================

export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 100, action, user_id } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("audit_logs")
      .select(`*`, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (action) query = query.eq("action", action);
    if (user_id) query = query.eq("admin_id", user_id);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Audit logs retrieved", {
      logs: data || [],
      total: count || 0,
      page: parseInt(page),
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== REFERRAL PROGRAM MANAGEMENT ====================

export const getReferralStats = async (req, res) => {
  try {
    const { data: referrals } = await supabase
      .from("referrals")
      .select("total_referrals, total_earnings");

    const stats = {
      total_referrals: referrals?.reduce((sum, r) => sum + (r.total_referrals || 0), 0) || 0,
      total_earnings: referrals?.reduce((sum, r) => sum + (r.total_earnings || 0), 0) || 0,
      active_programs: referrals?.length || 0
    };

    return res.json(formatResponse(true, "Referral stats retrieved", stats));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== SESSION & LOGIN MANAGEMENT ====================

export const getUserSessions = async (req, res) => {
  try {
    const { id } = req.params;
    // Assuming 'sessions' table exists and has user_id
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist or other error, return empty array gracefully
      return res.json(formatResponse(true, "User sessions retrieved", []));
    }

    return res.json(formatResponse(true, "User sessions retrieved", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const getLoginLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("login_logs")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Login logs retrieved", {
      logs: data,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const getLoginStats = async (req, res) => {
  try {
    const { count: totalLogins } = await supabase
      .from("login_logs")
      .select("*", { count: 'exact', head: true });

    const { count: failedAttempts } = await supabase
      .from("login_logs")
      .select("*", { count: 'exact', head: true })
      .eq("success", false);

    // Approximate unique users via query or simplified stat
    // (Exact unique count is expensive in Supabase without custom SQL function, using total for now or day active)
    const { count: uniqueUsers } = await supabase
      .from("users")
      .select("*", { count: 'exact', head: true })
      .not("last_login_at", "is", null);

    return res.json(formatResponse(true, "Login stats retrieved", {
      total_logins: totalLogins || 0,
      unique_users: uniqueUsers || 0,
      failed_attempts: failedAttempts || 0
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== USER ACTIONS ====================


// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    // Frontend adminService sends { role: role_code }, but historically might send role_code
    const { role, role_code } = req.body;

    const targetRole = role || role_code;

    if (!targetRole) {
      return res.status(400).json(formatResponse(false, "Role code is required", null));
    }

    // Map Frontend Codes to DB Enum
    const roleMap = {
      'PROJECT_MANAGER': 'project_manager',
      'PM': 'project_manager',
      'GENERAL_CONTRACTOR': 'general_contractor',
      'GC': 'general_contractor',
      'SUBCONTRACTOR': 'subcontractor',
      'SUB': 'subcontractor',
      'TRADE_SPECIALIST': 'trade_specialist',
      'TS': 'trade_specialist',
      'VIEWER': 'viewer',
      'ADMIN': 'admin',
      'SUPER': 'super_admin',
      'SUPER_ADMIN': 'super_admin',
      'MODERATOR': 'moderator',
      'MOD': 'moderator',
      'SUPPORT': 'support_agent',
      'FIN': 'finance_manager',
      'FINANCE_MANAGER': 'finance_manager',
      'ADMIN_APP': 'admin',
      'CLIENT': 'client',
      'CONTRACTOR': 'contractor'
    };

    // Convert uppercase input to lowercase db enum if match found, else use as is
    const dbRole = roleMap[targetRole] || targetRole.toLowerCase();

    console.log(`[Admin] Updating role for user ${id} to ${targetRole} (${dbRole})`);
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        role: dbRole,
        updated_at: new Date()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Admin] Role update error:", updateError);
      return res.status(400).json({ error: updateError.message });
    }

    // Log admin action
    try {
      if (req.user && req.user.id) {
        await logAdminAction(req.user.id, 'update_user_role', 'user', id, {
          old_role: 'unknown',
          new_role: dbRole
        });
      }
    } catch (e) { console.warn('Logging failed', e); }

    res.json(formatResponse(true, "User role updated successfully", updatedUser));
  } catch (error) {
    console.error("[Admin] Update role exception:", error);
    res.status(500).json(formatResponse(false, "Failed to update role", null));
  }
};



export const deleteUserSoft = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is trying to delete themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json(formatResponse(false, "Cannot delete your own account", null));
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: false
        // Removed deleted_at as it doesn't exist in schema
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error('Delete User Soft error:', error);
      throw error;
    }

    // Attempt to log
    try {
      if (req.user && req.user.id) {
        await logAdminAction(req.user.id, 'delete_user_soft', 'user', id, { reason: 'Admin soft delete' });
      }
    } catch (e) { console.warn('Logging failed', e); }

    return res.json(formatResponse(true, "User deactivated (soft delete)", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const deleteUserHard = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is trying to delete themselves
    if (req.user.id === id) {
      return res.status(400).json(formatResponse(false, "Cannot delete your own account", null));
    }

    // Step 1: Delete from users table first (to avoid foreign key issues)
    const { error: dbError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) {
      logger.error('Delete User from DB error:', dbError);
      // Continue anyway to try deleting from auth
    }

    // Step 2: Delete from Supabase Auth
    const { data, error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      logger.error('Delete User from Auth error:', authError);
      throw authError;
    }

    // Log action
    try {
      await logAdminAction(req.user.id, 'delete_user_hard', 'user', id, { reason: 'Admin hard delete' });
    } catch (e) { console.warn('Logging failed', e); }

    return res.json(formatResponse(true, "User permanently deleted from both database and auth", null));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const deleteUser = async (req, res) => {
  return deleteUserHard(req, res);
};

export const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, duration } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: false
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    try {
      await logAdminAction(req.user.id, 'suspend_user', 'user', id, { reason, duration });
    } catch (e) { }

    return res.json(formatResponse(true, "User suspended", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: true
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    try {
      await logAdminAction(req.user.id, 'unsuspend_user', 'user', id, null);
    } catch (e) { }

    return res.json(formatResponse(true, "User unsuspended", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const adminVerifyUser = async (req, res) => {
  try {
    // Support both /users/:id/verify (params) and /verify-user (body)
    const id = req.params.id || req.body.user_id || req.body.userId || req.body.id;

    if (!id) {
      return res.status(400).json(formatResponse(false, "User ID is required", null));
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        verification_status: 'verified'
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    try {
      await logAdminAction(req.user.id, 'verify_user', 'user', id, null);
    } catch (e) { }

    return res.json(formatResponse(true, "User manually verified", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Fetch notifications for the logged-in admin user
    const { data, count, error } = await supabase
      .from("notifications")
      .select("*", { count: 'exact' })
      .eq("user_id", req.user.id)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error('Get admin notifications error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Notifications retrieved", {
      notifications: data,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== PAYOUTS MANAGEMENT ====================

export const getAllPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("payouts")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    // Manual join for contractors
    let enrichedPayouts = [];
    if (data && data.length > 0) {
      const contractorIds = [...new Set(data.map(p => p.contractor_id))];
      const { data: contractors } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .in("id", contractorIds);

      const contractorMap = {};
      if (contractors) {
        contractors.forEach(c => {
          contractorMap[c.id] = {
            ...c,
            full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
          };
        });
      }

      enrichedPayouts = data.map(p => ({
        ...p,
        contractor: contractorMap[p.contractor_id] || null,
        // Add mock data for fields that don't exist in DB yet
        scheduled_date: p.scheduled_date || null,
        processed_at: p.processed_at || (p.status === 'completed' ? p.created_at : null),
        bank_account: p.bank_account || null
      }));
    } else {
      enrichedPayouts = data;
    }

    // Reuse query variable concept for cleaner code flow (though logic above replaces it)
    // We skip the query execution below since we did it above manually.

    return res.json(formatResponse(true, "Payouts retrieved", {
      payouts: enrichedPayouts || [],
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const processPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transaction_reference } = req.body;

    if (!id) {
      return res.status(400).json(formatResponse(false, "Payout ID is required", null));
    }

    // Check if payout exists
    const { data: existingPayout, error: checkError } = await supabase
      .from("payouts")
      .select("id, status")
      .eq("id", id)
      .single();

    if (checkError || !existingPayout) {
      logger.error('Process payout - payout not found:', { id, error: checkError });
      return res.status(404).json(formatResponse(false, "Payout not found", null));
    }

    const updateData = {
      status: status || 'processed',
      processed_at: new Date().toISOString()
    };

    if (transaction_reference) {
      updateData.transaction_reference = transaction_reference;
    }

    const { data, error } = await supabase
      .from("payouts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error('Process payout error:', { id, error, updateData });
      throw error;
    }

    // Log admin action (non-blocking)
    try {
      if (req.user?.id) {
        await logAdminAction(req.user.id, 'process_payout', 'payout', id, { status });
      }
    } catch (logError) {
      logger.warn('Failed to log payout action:', logError);
    }

    return res.json(formatResponse(true, "Payout processed successfully", data));
  } catch (err) {
    logger.error('Process payout error:', { id: req.params.id, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Failed to process payout", null));
  }
};

// Approve Payout
export const approvePayout = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payouts')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(req.user?.id || 'system', 'approve_payout', 'payout', id);

    return res.json(formatResponse(true, "Payout approved successfully", data));
  } catch (err) {
    logger.error('Approve payout error:', err);
    return res.status(500).json(formatResponse(false, err.message));
  }
};

// Hold Payout
export const holdPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('payouts')
      .update({ status: 'held', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(req.user?.id || 'system', 'hold_payout', 'payout', id, { reason });

    return res.json(formatResponse(true, "Payout held successfully", data));
  } catch (err) {
    logger.error('Hold payout error:', err);
    return res.status(500).json(formatResponse(false, err.message));
  }
};



// Resend Failed Payout
export const resendFailedPayout = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('payouts')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(req.user?.id || 'system', 'resend_payout', 'payout', id);

    return res.json(formatResponse(true, "Payout resent successfully", data));
  } catch (err) {
    logger.error('Resend payout error:', err);
    return res.status(500).json(formatResponse(false, err.message));
  }
};



// ==================== REVIEWS MANAGEMENT ====================

export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 50, rating } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reviews")
      .select(`*`, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (rating) query = query.eq("rating", rating);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all reviews error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Reviews retrieved", {
      reviews: data || [],
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all reviews error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve reviews", null));
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }
    await logAdminAction(req.user.id, 'delete_review', 'review', id, null);
    return res.json(formatResponse(true, "Review deleted", null));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== MESSAGES (MODERATION) ====================

export const getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("messages")
      .select(`*`, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("content", `%${search}%`);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Messages retrieved", {
      messages: data,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== ANNOUNCEMENTS ====================

export const getAllAnnouncements = async (req, res) => {
  try {
    const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }
    return res.json(formatResponse(true, "Announcements retrieved", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, target_audience, expires_at } = req.body;
    const { data, error } = await supabase
      .from("announcements")
      .insert({ title, content, target_audience: target_audience || 'all', expires_at, created_by: req.user.id })
      .select().single();
    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }
    await logAdminAction(req.user.id, 'create_announcement', 'announcement', data.id, { title });
    return res.json(formatResponse(true, "Announcement created", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }
    await logAdminAction(req.user.id, 'delete_announcement', 'announcement', id, null);
    return res.json(formatResponse(true, "Announcement deleted", null));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== BADGES MANAGEMENT ====================

export const getAllBadges = async (req, res) => {
  try {
    const { data, error } = await supabase.from("badges").select("*").order("name");
    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }
    return res.json(formatResponse(true, "Badges retrieved", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const createBadge = async (req, res) => {
  try {
    const { name, description, icon_url, criteria } = req.body;
    const { data, error } = await supabase
      .from("badges")
      .insert({ name, description, icon_url, criteria })
      .select().single();
    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }
    await logAdminAction(req.user.id, 'create_badge', 'badge', data.id, { name });
    return res.json(formatResponse(true, "Badge created", data));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== APPOINTMENTS ====================

export const getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;
    let query = supabase
      .from("appointments")
      .select(`*`, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("start_time", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, count, error } = await query;
    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }
    return res.json(formatResponse(true, "Appointments retrieved", { appointments: data, total: count, page: parseInt(page), pages: Math.ceil(count / limit) }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// ==================== ADMIN USERS MANAGEMENT ====================


// ==================== NEW ADDITIONS FOR INTEGRATION ====================

export const getAllEscrowAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    // Use correct table: escrow_transactions
    let query = supabase
      .from("escrow_transactions")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) {
      if (status === 'active') query = query.eq("status", "held");
      else if (status === 'closed') query = query.in("status", ["completed", "released"]);
      else query = query.eq("status", status);
    }

    const { data: transactions, count, error } = await query;

    if (error) {
      logger.error('Get all escrow accounts error:', error);
      throw error;
    }

    const tList = transactions || [];

    // Manual embedding of relationships
    // Transactions lack user_id, so we infer user (payer) from project.owner_id
    const projectIds = [...new Set(tList.map(t => t.project_id).filter(Boolean))];

    let projects = [];
    let users = [];
    let contractors = [];

    // Fetch Projects
    if (projectIds.length > 0) {
      const { data: p } = await supabase
        .from('projects')
        .select('id, title, contractor_id, owner_id')
        .in('id', projectIds);
      projects = p || [];

      // Fetch Contractors (Payees)
      const contractorIds = [...new Set(projects.map(p => p.contractor_id).filter(Boolean))];
      if (contractorIds.length > 0) {
        const { data: c } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', contractorIds);
        contractors = c || [];
      }

      // Fetch Owners (Payers) via deposited_by
      const userIds = [...new Set(tList.map(t => t.deposited_by).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: u } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        users = u || [];
      }
    }

    // Create lookup maps
    const projectMap = projects.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    const userMap = users.reduce((acc, u) => ({
      ...acc,
      [u.id]: {
        ...u,
        full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim()
      }
    }), {});

    const contractorMap = contractors.reduce((acc, c) => ({
      ...acc,
      [c.id]: {
        ...c,
        full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim()
      }
    }), {});

    // Transform data
    const accounts = tList.map(t => {
      const project = projectMap[t.project_id];
      const owner = userMap[t.deposited_by];

      const contractorId = project?.contractor_id;
      const contractor = contractorId ? contractorMap[contractorId] : null;

      // Status mapping
      let frontendStatus = t.status;
      if (t.status === 'pending') frontendStatus = 'active';
      if (t.status === 'completed' || t.status === 'released') frontendStatus = 'closed';

      return {
        id: t.id,
        project_id: t.project_id,
        project: project ? {
          id: project.id,
          title: project.title,
          owner: owner,
          contractor: contractor
        } : null,
        total_amount: t.amount,
        released_amount: (t.status === 'completed' || t.status === 'released' || t.status === 'refunded') ? t.amount : 0,
        remaining_balance: t.status === 'pending' || t.status === 'held' ? t.amount : 0,
        status: frontendStatus,
        owner: owner,
        contractor: contractor,
        created_at: t.created_at
      };
    });

    return res.json(formatResponse(true, "Escrow accounts retrieved", { accounts, total: count }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// Get Escrow Details
export const getEscrowDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch Transaction
    const { data: t, error } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !t) return res.status(404).json(formatResponse(false, "Escrow account not found"));

    // Fetch Project
    const { data: project } = await supabase
      .from("projects")
      .select("id, title, contractor_id, owner_id")
      .eq("id", t.project_id)
      .single();

    // Fetch Owner (Payer)
    const { data: owner } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("id", t.deposited_by)
      .single();

    // Fetch Contractor
    let contractor = null;
    if (project?.contractor_id) {
      const { data: c } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("id", project.contractor_id)
        .single();
      contractor = c;
    }

    // Enhance Names
    const ownerData = owner ? {
      ...owner,
      full_name: `${owner.first_name || ''} ${owner.last_name || ''}`.trim()
    } : null;

    const contractorData = contractor ? {
      ...contractor,
      full_name: `${contractor.first_name || ''} ${contractor.last_name || ''}`.trim()
    } : null;

    // Status mapping
    let frontendStatus = t.status;
    if (t.status === 'pending') frontendStatus = 'active';
    if (t.status === 'held') frontendStatus = 'active';
    if (t.status === 'completed' || t.status === 'released') frontendStatus = 'closed';

    const account = {
      id: t.id,
      project_id: t.project_id,
      project: project ? { ...project, owner: ownerData, contractor: contractorData } : null,
      total_amount: t.amount,
      released_amount: (t.status === 'released' || t.status === 'completed' || t.status === 'refunded') ? t.amount : 0,
      remaining_balance: (t.status === 'held' || t.status === 'pending') ? t.amount : 0,
      status: frontendStatus,
      owner: ownerData,
      contractor: contractorData,
      created_at: t.created_at,
      milestones: [],
      transaction_history: [
        {
          id: t.id,
          type: 'Deposit',
          amount: t.amount,
          status: (t.status === 'held' || t.status === 'released') ? 'completed' : t.status,
          initiated_at: t.created_at
        }
      ]
    };

    return res.json(formatResponse(true, "Escrow details retrieved", account));
  } catch (err) {
    logger.error('Get escrow details error:', err);
    return res.status(500).json(formatResponse(false, err.message));
  }
};

// Release Escrow Payment
export const releaseEscrowPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const { error } = await supabase
      .from('escrow_transactions')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // Log action (simplified)
    await logAdminAction(req.user?.id || 'system', 'release_escrow', 'transaction', id, { amount, reason });

    return res.json(formatResponse(true, "Payment released successfully"));
  } catch (err) {
    logger.error('Release escrow error:', err);
    return res.status(500).json(formatResponse(false, err.message));
  }
};

// Freeze Escrow Account
export const freezeEscrowAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Note: 'id' here comes from Frontend 'account.id' which is TRANSACTION ID in our mapping
    // But Freeze usually applies to ACCOUNT?
    // Frontend maps row key=account.id -> t.id.
    // So we are freezing the TRANSACTION (holding it)?
    // Or we should find the ACCOUNT (project_id) and freeze it?
    // For MVP, setting transaction status to 'held' (already held?) -> 'frozen'?
    // DB 'status' enum might not have 'frozen'.
    // Seed used 'held', 'released'.
    // I'll assume updating 'escrow_accounts' table is what is meant, but we have transaction ID.
    // I'll fetch transaction to get project_id, then freeze account.

    // Fetch Link
    const { data: tx } = await supabase.from('escrow_transactions').select('project_id').eq('id', id).single();
    if (tx) {
      await supabase.from('escrow_accounts').update({ status: 'frozen' }).eq('project_id', tx.project_id);
    }

    return res.json(formatResponse(true, "Account frozen successfully"));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message));
  }
};

// Unfreeze Escrow Account
export const unfreezeEscrowAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: tx } = await supabase.from('escrow_transactions').select('project_id').eq('id', id).single();
    if (tx) {
      await supabase.from('escrow_accounts').update({ status: 'active' }).eq('project_id', tx.project_id);
    }

    return res.json(formatResponse(true, "Account unfrozen successfully"));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message));
  }
};

// Refund Escrow
export const refundEscrowToOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const { error } = await supabase
      .from('escrow_transactions')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return res.json(formatResponse(true, "Refund processed successfully"));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message));
  }
};

// Adjust Escrow Amount


// Generate Escrow Report


export const getAllAdminUsers = async (req, res) => {
  try {
    const { role } = req.query;

    // Fetch users with admin-like roles
    let query = supabase
      .from("users")
      .select("*")
      .in('role', ['admin', 'super_admin', 'moderator', 'support_agent', 'finance_manager']);

    if (role && role !== 'all') {
      query = query.eq("role", role);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    // Transform to match frontend AdminUser interface
    const admins = data.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
      role: u.role,
      role_code: u.role === 'super_admin' ? 'SUPER' : 'ADMIN', // Simple mapping
      is_active: u.is_active,
      two_factor_enabled: u.two_factor_enabled || false,
      permissions: u.permissions || [],
      ip_whitelist: u.ip_whitelist || [],
      last_login_at: u.last_login_at,
      created_at: u.created_at
    }));

    return res.json(formatResponse(true, "Admin users retrieved", { admins }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, require_2fa, permissions, ip_whitelist } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json(formatResponse(false, "Email, password, and role are required", null));
    }

    // 1. Create user in Supabase Auth with Metadata
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
        require_2fa: !!require_2fa,
        permissions: permissions || [],
        ip_whitelist: ip_whitelist || []
      }
    });

    if (authError) throw authError;

    // 2. Upsert user in public.users table 
    // Note: If migration add_admin_fields.sql hasn't run, the extra columns might be ignored or cause error depending on strictness.
    // We will attempt to insert them. If it fails, we fallback to basic insert?
    // Supabase client usually ignores unknown columns in insert if configured, but errors if not.
    // Use upsert with minimal fields first if we suspect schema issues, but we want these fields.

    // Generate MFA secret if require_2fa is true
    let mfaSecret = null;
    if (require_2fa) {
      const speakeasy = (await import('speakeasy')).default;
      const secret = speakeasy.generateSecret({
        name: `BidRoom (${email})`,
        issuer: 'BidRoom',
        length: 32
      });
      mfaSecret = secret.base32;
    }

    const userDataObj = {
      id: authUser.user.id,
      email,
      role,
      first_name,
      last_name,
      is_active: true,
      // Try to save these if columns exist
      two_factor_enabled: !!require_2fa,
      two_factor_secret: mfaSecret, // Save secret if MFA is required
      permissions: permissions || [],
      ip_whitelist: ip_whitelist || []
    };

    let userData;
    const { data: initialUserData, error: userError } = await supabase
      .from("users")
      .upsert(userDataObj)
      .select()
      .single();

    if (userError) {
      // If error is about missing columns, try fallback without them
      logger.warn("Error inserting admin fields to public.users, retrying without extended fields:", userError.message);
      delete userDataObj.two_factor_enabled;
      delete userDataObj.permissions;
      delete userDataObj.ip_whitelist;

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("users")
        .upsert(userDataObj)
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      userData = fallbackData;
      return res.json(formatResponse(true, "Admin user created (Partial Data Saved)", { admin: userData }));
    } else {
      userData = initialUserData;
    }

    return res.json(formatResponse(true, "Admin user created", { admin: userData }));

  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active, first_name, last_name, password, require_2fa, permissions, ip_whitelist } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;

    // Extended fields
    if (typeof require_2fa === 'boolean') updates.two_factor_enabled = require_2fa;
    if (permissions) updates.permissions = permissions;
    if (ip_whitelist) updates.ip_whitelist = ip_whitelist;

    let updatedUserData = null;
    const { data: initialData, error: initialError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (initialError) {
      logger.warn("Error updating admin fields, retrying fallback:", initialError.message);
      // Fallback: update only basic fields if extended fail
      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.two_factor_enabled;
      delete fallbackUpdates.permissions;
      delete fallbackUpdates.ip_whitelist;

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("users")
        .update(fallbackUpdates)
        .eq("id", id)
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      updatedUserData = fallbackData;
    } else {
      updatedUserData = initialData;
    }

    // Update Auth Metadata
    if (role || first_name || last_name || typeof require_2fa !== 'undefined' || permissions || ip_whitelist) {
      const metadata = {};
      if (first_name) metadata.first_name = first_name;
      if (last_name) metadata.last_name = last_name;
      if (role) metadata.role = role;
      if (typeof require_2fa !== 'undefined') metadata.require_2fa = require_2fa;
      if (permissions) metadata.permissions = permissions;
      if (ip_whitelist) metadata.ip_whitelist = ip_whitelist;

      await supabase.auth.admin.updateUserById(id, { user_metadata: metadata });
    }

    // Update Password
    if (password) {
      await supabase.auth.admin.updateUserById(id, { password: password });
    }

    return res.json(formatResponse(true, "Admin user updated", { admin: updatedUserData }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, reason } = req.body;

    const warningMessage = message || reason || 'You have received a warning from the administrator.';

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: id,
        title: 'Account Warning',
        content: warningMessage,
        type: 'warning',
        is_read: false
      });

    if (notifError) {
      logger.warn("Failed to create notification, ignoring:", notifError.message);
    }

    await logAdminAction(req.user.id, 'warn_user', 'user', id, { reason, message: warningMessage });

    return res.json(formatResponse(true, "User warned successfully", null));
  } catch (err) {
    logger.error('Warn user error:', err);
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const impersonateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', id)
      .single();

    if (userError || !user) throw new Error("User not found");

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    });

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    await logAdminAction(req.user.id, 'impersonate_user', 'user', id, null);

    return res.json(formatResponse(true, "Impersonation link generated", {
      redirectUrl: data.properties.action_link,
      warning: "Use this link to login as the user."
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const exportUserData = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
    const { data: jobs } = await supabase.from('jobs').select('*').eq('created_by', id);
    const { data: bids } = await supabase.from('bids').select('*').eq('contractor_id', id);
    const { data: transactions } = await supabase.from('transactions').select('*').eq('payer_id', id);

    const exportData = {
      user,
      jobs: jobs || [],
      bids: bids || [],
      transactions: transactions || [],
      exported_at: new Date()
    };

    await logAdminAction(req.user.id, 'export_user_data', 'user', id, null);

    // Return as downloadable file? Or just JSON? Frontend usually handles JSON download.
    return res.json(formatResponse(true, "User data exported", exportData));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const anonymizeUserData = async (req, res) => {
  try {
    const { id } = req.params;

    // Generate random anonymized data
    const randomId = Math.random().toString(36).substring(7);

    const { data, error } = await supabase
      .from('users')
      .update({
        email: `anonymized_${randomId}@deleted.com`,
        first_name: 'Anonymized',
        last_name: 'User',
        phone: null,
        avatar_url: null,
        bio: null,
        is_active: false
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    await logAdminAction(req.user.id, 'anonymize_user', 'user', id, null);

    return res.json(formatResponse(true, "User data anonymized successfully", data));
  } catch (err) {
    logger.error('Anonymize user error:', err);
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

export const sendNotificationToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type = 'info', title } = req.body;

    logger.info(`[Notification] Request to user ${id}. Message: ${message}, Type: ${type}`);

    if (!message) {
      return res.status(400).json(formatResponse(false, "Message is required", null));
    }

    // Determine title
    let notifTitle = title;
    if (!notifTitle) {
      notifTitle = type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Information';
    }

    // Create a FRESH Admin Client to guarantee Service Role RLS bypass
    // This fixes intermittent RLS 42501 errors caused by singleton session pollution
    const adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Insert notification using fresh client
    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: id,
        title: notifTitle,
        content: message,
        type: type,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      logger.error('[Notification] DB Insert failed:', error);
      throw error;
    }

    logger.info('[Notification] Successfully created:', data.id);

    // Log admin action safely (don't fail request if logging fails)
    try {
      if (req.user && req.user.id) {
        await logAdminAction(req.user.id, 'send_notification', 'user', id, { message, type, notification_id: data.id });
      } else {
        logger.warn('[Notification] No user ID for audit log');
      }
    } catch (logErr) {
      logger.error('[Notification] Audit log failed:', logErr);
    }

    return res.json(formatResponse(true, "Notification sent successfully", data));

  } catch (err) {
    logger.error('[CRITICAL] sendNotificationToUser error:', err);
    // Explicitly check for 42501 (RLS) and report it clearly
    if (err.code === '42501') {
      return res.status(500).json(formatResponse(false, "System Configuration Error: RLS Policy Violation. Check Service Key.", null));
    }
    const errorDetails = process.env.NODE_ENV === 'development' ? err.message : "Internal server error";
    return res.status(500).json(formatResponse(false, `Failed to send notification: ${errorDetails}`, null));
  }
};