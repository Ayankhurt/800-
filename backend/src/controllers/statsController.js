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
      .eq('projects_manager_id', userId);

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

    // Get bids received (for PM/GC)
    let bidsReceived = 0;
    if (req.user.role === 'PM' || req.user.role === 'GC' || req.user.role === 'project_manager' || req.user.role === 'general_contractor') {
      const { count } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', createdJobIds.length > 0 ? createdJobIds[0] : null); // Simple variant for now, or use IN

      // Better: Count applications for all user's jobs
      if (createdJobIds.length > 0) {
        const { count: totalRec } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', createdJobIds);
        bidsReceived = totalRec || 0;
      }
    }

    logger.info(`[getUserDashboardStats] Stats retrieved - Jobs: ${totalJobs}, Projects: ${activeProjects}, Bids Submitted: ${bidsSubmitted}, Bids Received: ${bidsReceived}`);

    return res.json(
      formatResponse(true, 'User dashboard stats retrieved', {
        totalJobs: totalJobs || 0,
        activeProjects: activeProjects || 0,
        bidsSubmitted: bidsSubmitted || 0,
        bidsReceived: bidsReceived || 0, // NEW
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
      .from('users')
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

    // Get finance summary - FIXED: use transactions as primary source of truth for completed revenue
    const { data: payments } = await supabase
      .from('transactions')
      .select('amount, status');

    const totalRevenue = (payments || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const pendingPayments = (payments || [])
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount, status');

    const totalPayouts = (payouts || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Get Support Stats
    const { count: openTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    const { count: pendingTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'); // Assuming 'pending' review maps to open tickets for now, or check specific status

    // Resolved Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: resolvedToday } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('updated_at', today.toISOString());

    // Resolved Yesterday (for growth calc)
    const yesterdayStart = new Date(today);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const { count: resolvedYesterday } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('updated_at', yesterdayStart.toISOString())
      .lt('updated_at', today.toISOString());

    // Created Today (for trend calc)
    const { count: createdToday } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Created Yesterday
    const { count: createdYesterday } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', today.toISOString());

    // Calculate Percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const resolvedGrowth = calculateGrowth(resolvedToday || 0, resolvedYesterday || 0);
    const ticketsGrowth = calculateGrowth(createdToday || 0, createdYesterday || 0);

    // Verifications Queue
    const { count: verificationsQueue } = await supabase
      .from('contractor_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    // Moderation Reports
    let totalReports = 0;
    try {
      const { count } = await supabase
        .from('moderation_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      totalReports = count || 0;
    } catch (e) {
      // Table might not exist yet
    }


    const responseData = {
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
      supportStats: {
        pendingReview: pendingTickets || 0,
        openTickets: openTickets || 0,
        verificationsQueue: verificationsQueue || 0,
        resolvedToday: resolvedToday || 0,
        totalReports: totalReports || 0,
        resolvedGrowth,
        ticketsGrowth
      }
    };

    logger.info(`[getAdminDashboardStats] Sending response: ${JSON.stringify(responseData.supportStats)}`);

    return res.json(
      formatResponse(true, 'Admin dashboard stats retrieved', responseData)
    );
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

