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
    const { page = 1, limit = 50, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("projects")
      .select(`
        *,
        owner:users!projects_owner_id_fkey (id, first_name, last_name, email),
        contractor:users!projects_contractor_id_fkey (id, first_name, last_name, company_name)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all projects error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "Projects retrieved", {
      projects: data || [],
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

// ==================== JOBS MANAGEMENT ====================

export const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, trade_type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("jobs")
      .select(`
        *,
        project_manager:users!jobs_project_manager_id_fkey (id, first_name, last_name, email)
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

    return res.json(formatResponse(true, "Jobs retrieved", {
      jobs: data || [],
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all jobs error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve jobs", null));
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

    const completed = transactions?.filter(t => t.status === 'completed') || [];
    const totalRevenue = completed.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyRevenue = completed
      .filter(t => t.created_at && new Date(t.created_at) >= thisMonth)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const stats = {
      total_revenue: totalRevenue || 0,
      monthly_revenue: monthlyRevenue || 0,
      total_transactions: transactions?.length || 0,
      completed_transactions: completed.length || 0,
      pending_transactions: transactions?.filter(t => t.status === 'pending').length || 0,
      failed_transactions: transactions?.filter(t => t.status === 'failed').length || 0
    };

    return res.json(formatResponse(true, "Financial stats retrieved", stats));
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
      const userIds = [...new Set(data.map(i => i.sender_id).filter(Boolean))];
      const projectIds = [...new Set(data.map(i => i.project_id).filter(Boolean))];

      const { data: users } = await supabase.from("users").select("id, first_name, last_name, email").in("id", userIds);
      const { data: projects } = await supabase.from("projects").select("id, title").in("id", projectIds);

      const userMap = {};
      users?.forEach(u => userMap[u.id] = u);
      const projectMap = {};
      projects?.forEach(p => projectMap[p.id] = p);

      enrichedData = data.map(i => ({
        ...i,
        user: userMap[i.sender_id] || null,
        project: projectMap[i.project_id] || null
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

    const { data, count, error } = await supabase
      .from("verification_requests")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error('Get all verification requests error:', error);
      throw error;
    }

    // Manual Encodement
    let enrichedData = [];
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(i => i.user_id).filter(Boolean))];
      const { data: users } = await supabase.from("users").select("id, first_name, last_name, email, company_name").in("id", userIds);

      const userMap = {};
      users?.forEach(u => userMap[u.id] = u);

      enrichedData = data.map(i => ({
        ...i,
        user: userMap[i.user_id] || null
      }));
    } else {
      enrichedData = data || [];
    }

    return res.json(formatResponse(true, "Verification requests retrieved", {
      requests: enrichedData,
      total: count || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((count || 0) / limit)
    }));
  } catch (err) {
    logger.error('Get all verification requests error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to retrieve verification requests", null));
  }
};

// ==================== CONTENT MODERATION ====================

export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, content_type } = req.query;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("content_reports")
      .select("*", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    // Manual Encodement
    let enrichedData = [];
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(i => i.reported_by).filter(Boolean))];
      const { data: users } = await supabase.from("users").select("id, first_name, last_name, email").in("id", userIds);

      const userMap = {};
      users?.forEach(u => userMap[u.id] = u);

      enrichedData = data.map(i => ({
        ...i,
        reported_by_user: userMap[i.reported_by] || null
      }));
    } else {
      enrichedData = data;
    }

    return res.json(formatResponse(true, "Content reports retrieved", {
      reports: enrichedData,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit)
    }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
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
    const { key, value, description } = req.body;

    const { data, error } = await supabase
      .from("system_settings")
      .upsert({
        key,
        value,
        description,
        updated_by: req.user.id,
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    return res.json(formatResponse(true, "System setting updated", data));
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

    // Perform Hard Delete via Supabase Auth Admin
    // This removes from auth.users and should cascade to public.users
    const { data, error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      logger.error('Delete User Auth error:', error);
      throw error;
    }

    // Log action
    try {
      await logAdminAction(req.user.id, 'delete_user_hard', 'user', id, { reason: 'Admin hard delete' });
    } catch (e) { console.warn('Logging failed', e); }

    return res.json(formatResponse(true, "User permanently deleted", null));
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
        contractors.forEach(c => contractorMap[c.id] = c);
      }

      enrichedPayouts = data.map(p => ({
        ...p,
        contractor: contractorMap[p.contractor_id] || null
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
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("escrow_transactions")
      .select("*, projects(id, title), owner:users!payer_id(id, first_name, last_name, email), contractor:users!payee_id(id, first_name, last_name, email)", { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) {
      // Map frontend status to backend status if needed
      // Frontend: active, frozen, closed, disputed
      // Backend (escrow_transactions): held, released, failed
      if (status === 'active') query = query.eq("status", "held");
      else if (status === 'closed') query = query.eq("status", "released");
      else query = query.eq("status", status);
    }

    if (search) {
      // Search is tricky with relations, skipping for V1
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error('Get all payouts error:', error);
      throw error;
    }

    // Transform data to match frontend EscrowAccount interface
    const accounts = data.map(t => ({
      id: t.id,
      project_id: t.project_id,
      project: t.projects ? {
        id: t.projects.id,
        title: t.projects.title,
        owner: t.owner,
        contractor: t.contractor
      } : null,
      total_amount: t.amount,
      released_amount: t.status === 'released' ? t.amount : 0,
      remaining_balance: t.status === 'held' ? t.amount : 0,
      status: t.status === 'held' ? 'active' : (t.status === 'released' ? 'closed' : t.status),
      owner: t.owner,
      contractor: t.contractor,
      created_at: t.created_at
    }));

    return res.json(formatResponse(true, "Escrow accounts retrieved", { accounts, total: count }));
  } catch (err) {
    logger.error('API error:', { endpoint: req.path, error: err });
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

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