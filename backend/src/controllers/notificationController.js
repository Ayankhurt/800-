import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import logger from "../utils/logger.js";

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     total:
 *                       type: integer
 *                     unread:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0, is_read } = req.query;

        logger.info(`[DEBUG] getUserNotifications - UserID: ${userId}, Query Params:`, req.query);


        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (is_read !== undefined) {
            query = query.eq('is_read', is_read === 'true');
        }

        const { data, count, error } = await query;

        if (error) {
            logger.error('Get notifications error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "Notifications retrieved", {
            notifications: data || [],
            total: count || 0,
            unread: data?.filter(n => !n.is_read).length || 0
        }));
    } catch (err) {
        logger.error('Get user notifications error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get all notifications (admin)
export const getAllNotifications = async (req, res) => {
    try {
        const { limit = 100, offset = 0, user_id, is_read, type } = req.query;

        let query = supabase
            .from('notifications')
            .select(`
        *,
        user:users(id, email, first_name, last_name)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (user_id) {
            query = query.eq('user_id', user_id);
        }

        if (is_read !== undefined) {
            query = query.eq('is_read', is_read === 'true');
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data, count, error } = await query;

        if (error) {
            logger.error('Get all notifications error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "Notifications retrieved", {
            notifications: data || [],
            total: count || 0
        }));
    } catch (err) {
        logger.error('Get all notifications error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            logger.error('Mark notification as read error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "Notification marked as read", data));
    } catch (err) {
        logger.error('Mark notification as read error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('is_read', false)
            .select();

        if (error) {
            logger.error('Mark all notifications as read error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "All notifications marked as read", {
            updated: data?.length || 0
        }));
    } catch (err) {
        logger.error('Mark all notifications as read error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            logger.error('Delete notification error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "Notification deleted", null));
    } catch (err) {
        logger.error('Delete notification error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            logger.error('Get unread count error:', error);
            throw error;
        }

        return res.json(formatResponse(true, "Unread count retrieved", {
            unread: count || 0
        }));
    } catch (err) {
        logger.error('Get unread count error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Send bulk notifications (admin)
export const sendBulkNotifications = async (req, res) => {
    try {
        const { user_ids, message, type = 'info', title } = req.body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json(formatResponse(false, "user_ids array is required", null));
        }

        if (!message) {
            return res.status(400).json(formatResponse(false, "message is required", null));
        }

        const notifications = user_ids.map(user_id => ({
            user_id,
            title: title || (type === 'warning' ? 'Warning' : type === 'info' ? 'Information' : 'Notification'),
            content: message,
            type,
            is_read: false
        }));

        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) {
            logger.error('Send bulk notifications error:', error);
            throw error;
        }

        return res.json(formatResponse(true, `${data.length} notifications sent successfully`, {
            sent: data.length,
            notifications: data
        }));
    } catch (err) {
        logger.error('Send bulk notifications error:', err);
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
