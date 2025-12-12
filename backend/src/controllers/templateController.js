import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Create template
export const createTemplate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content, category } = req.body;

        if (!title || !content) {
            return res.status(400).json(formatResponse(false, "Title and content required", null));
        }

        const { data, error } = await supabase
            .from("message_templates")
            .insert({
                user_id: userId,
                title,
                content,
                category: category || 'general'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Template created", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get my templates
export const getMyTemplates = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("message_templates")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Templates retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Delete template
export const deleteTemplate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from("message_templates")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

        if (error) throw error;

        return res.json(formatResponse(true, "Template deleted", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
