import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Get available badges
export const getAvailableBadges = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("badges")
            .select("*")
            .eq("is_active", true);

        if (error) throw error;

        return res.json(formatResponse(true, "Badges retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Assign badge to user (admin only)
export const assignBadge = async (req, res) => {
    try {
        const { user_id, badge_id, expiry_date } = req.body;

        const { data, error } = await supabase
            .from("user_badges")
            .insert({
                user_id,
                badge_id,
                expiry_date,
                assigned_by: req.user.id
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Badge assigned", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get user badges
export const getUserBadges = async (req, res) => {
    try {
        const { user_id } = req.params;

        const { data, error } = await supabase
            .from("user_badges")
            .select(`
        *,
        badge:badges (*)
      `)
            .eq("user_id", user_id)
            .gte("expiry_date", new Date().toISOString()); // Only active badges

        if (error) throw error;

        return res.json(formatResponse(true, "User badges retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
