// Admin Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

export const adminService = {
  /**
   * Get admin activity logs
   */
  async getAdminLogs(limit = 50, offset = 0) {
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    // Get admin activity logs with pagination
    const { data, error, count } = await supabase
      .from('admin_activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      return formatResponse(false, error.message, null);
    }

    // Format response to match required structure
    const formattedLogs = (data || []).map(log => ({
      id: log.id,
      userId: log.admin_id,
      action: log.action,
      metadata: log.changes ? (typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes) : {
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
      },
      createdAt: log.created_at,
    }));

    return formatResponse(true, 'Admin logs retrieved', {
      logs: formattedLogs,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count || 0,
      },
    });
  },

  /**
   * Get admin notifications
   */
  async getAdminNotifications(limit = 50, offset = 0, type = null) {
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      return formatResponse(false, error.message, null);
    }

    // Get all notification types
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('type');

    const allTypes = [...new Set((allNotifications || []).map(n => n.type).filter(Boolean))];

    // Format notifications with required fields
    const formattedNotifications = (data || []).map(notif => ({
      id: notif.id,
      userId: notif.user_id,
      type: notif.type || null,
      title: notif.title,
      message: notif.message || notif.body,
      createdAt: notif.created_at,
    }));

    return formatResponse(true, 'Admin notifications retrieved', {
      notifications: formattedNotifications,
      allTypes,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: count || 0,
      },
    });
  },

  /**
   * Log admin action
   */
  async logAdminAction(adminId, action, resourceType = null, resourceId = null, changes = null, ipAddress = null, userAgent = null) {
    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: adminId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          changes: changes ? JSON.stringify(changes) : null,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Failed to log admin action:', error.message);
        // Don't fail the request if logging fails
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging admin action:', error.message);
      return null;
    }
  },
};

