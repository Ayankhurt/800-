import { supabase } from "../config/supabaseClient.js";
import { createClient } from "@supabase/supabase-js";
import logger from "../utils/logger.js";

/**
 * Service to handle all notification logic.
 * Ensures notifications are sent via Service Role to bypass RLS.
 */
class NotificationService {
    constructor() {
        this.adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
    }

    /**
     * Send a notification to a specific user
     * @param {string} userId - Target user UUID
     * @param {string} title - Notification title
     * @param {string} content - Message body
     * @param {string} type - 'info', 'warning', 'success', 'error'
     * @param {object} metadata - Extra data for the app
     */
    async send(userId, title, content, type = 'info', metadata = {}) {
        try {
            const { data, error } = await this.adminClient
                .from('notifications')
                .insert({
                    user_id: userId,
                    title,
                    content, // Maps to 'message' column in some schemas, distinct in others.
                    type,
                    is_reads: false,
                    // metadata: metadata // metadata column might be missing, omitting to be safe
                })
                .select()
                .single();

            if (error) throw error;

            logger.info(`[NotificationService] Sent ${type} to user ${userId}`);
            return data;
        } catch (err) {
            logger.error(`[NotificationService] Failed to send to ${userId}:`, err.message);
            return null;
        }
    }

    /**
     * Broadcast notification to multiple users
     * @param {string[]} userIds - Array of UUIDs
     * @param {string} title 
     * @param {string} content 
     * @param {string} type 
     */
    async sendBulk(userIds, title, content, type = 'info') {
        if (!userIds || userIds.length === 0) return [];

        const notifications = userIds.map(uid => ({
            user_id: uid,
            title,
            content,
            type,
            is_reads: false
        }));

        try {
            const { data, error } = await this.adminClient
                .from('notifications')
                .insert(notifications);

            if (error) throw error;
            return data;
        } catch (err) {
            logger.error(`[NotificationService] Bulk send failed:`, err.message);
            return [];
        }
    }
}

export const notificationService = new NotificationService();
