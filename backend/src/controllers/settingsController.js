import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Get user settings
export const getSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("user_settings")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // If no settings exist, create default
        if (!data) {
            const { data: newSettings, error: createError } = await supabase
                .from("user_settings")
                .insert({
                    user_id: userId,
                    email_notifications: true,
                    push_notifications: true,
                    sms_notifications: false,
                    marketing_emails: false,
                    language: 'en',
                    timezone: 'America/Los_Angeles'
                })
                .select()
                .single();

            if (createError) throw createError;
            return res.json(formatResponse(true, "Settings retrieved", newSettings));
        }

        return res.json(formatResponse(true, "Settings retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update user settings
export const updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            email_notifications,
            push_notifications,
            sms_notifications,
            marketing_emails,
            language,
            timezone,
            privacy_profile_visible,
            privacy_show_email,
            privacy_show_phone
        } = req.body;

        const updateData = {};
        if (email_notifications !== undefined) updateData.email_notifications = email_notifications;
        if (push_notifications !== undefined) updateData.push_notifications = push_notifications;
        if (sms_notifications !== undefined) updateData.sms_notifications = sms_notifications;
        if (marketing_emails !== undefined) updateData.marketing_emails = marketing_emails;
        if (language) updateData.language = language;
        if (timezone) updateData.timezone = timezone;
        if (privacy_profile_visible !== undefined) updateData.privacy_profile_visible = privacy_profile_visible;
        if (privacy_show_email !== undefined) updateData.privacy_show_email = privacy_show_email;
        if (privacy_show_phone !== undefined) updateData.privacy_show_phone = privacy_show_phone;

        // Check if settings exist
        const { data: existing } = await supabase
            .from("user_settings")
            .select("id")
            .eq("user_id", userId)
            .single();

        let data, error;

        if (existing) {
            // Update existing
            const result = await supabase
                .from("user_settings")
                .update(updateData)
                .eq("user_id", userId)
                .select()
                .single();
            data = result.data;
            error = result.error;
        } else {
            // Insert new
            const result = await supabase
                .from("user_settings")
                .insert({
                    user_id: userId,
                    ...updateData
                })
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        return res.json(formatResponse(true, "Settings updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get notification preferences
export const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("user_settings")
            .select("email_notifications, push_notifications, sms_notifications, marketing_emails")
            .eq("user_id", userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return res.json(formatResponse(true, "Notification preferences retrieved", data || {
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            marketing_emails: false
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email_notifications, push_notifications, sms_notifications, marketing_emails } = req.body;

        const { data, error } = await supabase
            .from("user_settings")
            .upsert({
                user_id: userId,
                email_notifications,
                push_notifications,
                sms_notifications,
                marketing_emails
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Notification preferences updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get privacy settings
export const getPrivacySettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("user_settings")
            .select("privacy_profile_visible, privacy_show_email, privacy_show_phone")
            .eq("user_id", userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return res.json(formatResponse(true, "Privacy settings retrieved", data || {
            privacy_profile_visible: true,
            privacy_show_email: false,
            privacy_show_phone: false
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update privacy settings
export const updatePrivacySettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { privacy_profile_visible, privacy_show_email, privacy_show_phone } = req.body;

        const { data, error } = await supabase
            .from("user_settings")
            .upsert({
                user_id: userId,
                privacy_profile_visible,
                privacy_show_email,
                privacy_show_phone
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Privacy settings updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
