import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Save/favorite a contractor
export const saveContractor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contractor_id } = req.body;

        if (!contractor_id) {
            return res.status(400).json(formatResponse(false, "Contractor ID required", null));
        }

        // Check if already saved
        const { data: existing } = await supabase
            .from("saved_contractors")
            .select("id")
            .eq("user_id", userId)
            .eq("contractor_id", contractor_id)
            .single();

        if (existing) {
            return res.status(400).json(formatResponse(false, "Contractor already saved", null));
        }

        const { data, error } = await supabase
            .from("saved_contractors")
            .insert({
                user_id: userId,
                contractor_id
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Contractor saved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get saved contractors
export const getSavedContractors = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("saved_contractors")
            .select(`
        *,
        contractor:users!saved_contractors_contractor_id_fkey (
          id, first_name, last_name, email, avatar_url, company_name, 
          location, trust_score,
          contractor_profiles (
            specialties, years_in_business, hourly_rate, avg_rating, review_count
          )
        )
      `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Saved contractors retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Unsave contractor
export const unsaveContractor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contractor_id } = req.params;

        const { error } = await supabase
            .from("saved_contractors")
            .delete()
            .eq("user_id", userId)
            .eq("contractor_id", contractor_id);

        if (error) throw error;

        return res.json(formatResponse(true, "Contractor unsaved", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Check if contractor is saved
export const checkIfSaved = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contractor_id } = req.params;

        const { data } = await supabase
            .from("saved_contractors")
            .select("id")
            .eq("user_id", userId)
            .eq("contractor_id", contractor_id)
            .single();

        return res.json(formatResponse(true, "Check complete", { is_saved: !!data }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
