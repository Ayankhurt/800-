// Stats Controller
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';
import logger from '../utils/logger.js';

export const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.error(`[getUserDashboardStats] Missing user ID in request`);
      return res.status(401).json(formatResponse(false, "User not authenticated", null));
    }

    logger.info(`[getUserDashboardStats] Fetching stats for user ID: ${userId}`);

    // Get total jobs (jobs user has applied to or created)
    // Count jobs where user is the creator OR has applied
    const { data: userCreatedJobs } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: false })
      .eq('created_by', userId);

    const { data: userApplications } = await supabase
      .from('job_applications')
      .select('job_id', { count: 'exact', head: false })
      .eq('contractor_id', userId);

    // Get unique job count (created + applied)
    const createdJobIds = (userCreatedJobs || []).map(j => j.id);
    const appliedJobIds = [...new Set((userApplications || []).map(a => a.job_id))];
    const totalJobs = new Set([...createdJobIds, ...appliedJobIds]).size;

    // Get active projects (projects where user is owner or contractor)
    let activeProjects = 0;
    try {
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .or(`owner_id.eq.${userId},contractor_id.eq.${userId}`)
        .eq('status', 'active');
      activeProjects = count || 0;
    } catch (projectsError) {
      logger.error(`[getUserDashboardStats] Error fetching active projects:`, projectsError);
      activeProjects = 0;
    }

    // Get bids submitted
    let bidsSubmitted = 0;
    try {
      const { count } = await supabase
        .from('bid_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('contractor_id', userId);
      bidsSubmitted = count || 0;
    } catch (bidsError) {
      logger.error(`[getUserDashboardStats] Error fetching bids:`, bidsError);
      bidsSubmitted = 0;
    }

    // Get milestones completed - need to get user projects first
    const { data: userProjects } = await supabase
      .from('projects')
      .select('id')
      .or(`owner_id.eq.${userId},contractor_id.eq.${userId}`);

    const projectIds = (userProjects || []).map(p => p.id);
    let milestonesCompletedCount = 0;
    if (projectIds.length > 0) {
      const { count } = await supabase
        .from('project_milestones')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('status', 'completed');
      milestonesCompletedCount = count || 0;
    }

    logger.info(`[getUserDashboardStats] Stats retrieved - Jobs: ${totalJobs}, Projects: ${activeProjects}, Bids: ${bidsSubmitted}, Milestones: ${milestonesCompletedCount}`);

    return res.json(
      formatResponse(true, 'User dashboard stats retrieved', {
        totalJobs: totalJobs || 0,
        activeProjects: activeProjects || 0,
        bidsSubmitted: bidsSubmitted || 0,
        milestonesCompleted: milestonesCompletedCount || 0,
      })
    );
  } catch (error) {
    logger.error(`[getUserDashboardStats] Error:`, error);
    return res.status(500).json(formatResponse(false, error.message || "Failed to retrieve dashboard stats", null));
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get pending approvals (projects pending approval)
    const { count: pendingApprovals } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get open disputes
    const { count: openDisputes } = await supabase
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get total projects
    const { count: totalProjects } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Get finance summary
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status');

    const totalRevenue = (payments || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const pendingPayments = (payments || [])
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount, status');

    const totalPayouts = (payouts || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return res.json(
      formatResponse(true, 'Admin dashboard stats retrieved', {
        totalUsers: totalUsers || 0,
        pendingApprovals: pendingApprovals || 0,
        openDisputes: openDisputes || 0,
        totalProjects: totalProjects || 0,
        financeSummary: {
          totalRevenue,
          pendingPayments,
          totalPayouts,
          netRevenue: totalRevenue - totalPayouts,
        },
      })
    );
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

