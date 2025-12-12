import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Give endorsement to contractor
export const giveEndorsement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contractor_id, skill, message } = req.body;

        if (!contractor_id || !skill) {
            return res.status(400).json(formatResponse(false, "Contractor ID and skill required", null));
        }

        // Check if already endorsed for this skill
        const { data: existing } = await supabase
            .from("endorsements")
            .select("id")
            .eq("contractor_id", contractor_id)
            .eq("endorsed_by", userId)
            .eq("skill", skill)
            .single();

        if (existing) {
            return res.status(400).json(formatResponse(false, "You have already endorsed this skill", null));
        }

        const { data, error } = await supabase
            .from("endorsements")
            .insert({
                contractor_id,
                endorsed_by: userId,
                skill,
                message
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Endorsement given", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get contractor's endorsements
export const getEndorsements = async (req, res) => {
    try {
        const { contractor_id } = req.params;

        const { data, error } = await supabase
            .from("endorsements")
            .select("*")
            .eq("contractor_id", contractor_id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Endorsements retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Remove endorsement
export const removeEndorsement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from("endorsements")
            .delete()
            .eq("id", id)
            .eq("endorsed_by", userId);

        if (error) throw error;

        return res.json(formatResponse(true, "Endorsement removed", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
