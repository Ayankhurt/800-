import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Request a video consultation
export const requestConsultation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { contractor_id, requested_date, duration_minutes, topic, description } = req.body;

        if (!contractor_id || !requested_date) {
            return res.status(400).json(formatResponse(false, "Contractor ID and date required", null));
        }

        const { data, error } = await supabase
            .from("video_consultations")
            .insert({
                requester_id: userId,
                contractor_id,
                requested_date,
                duration_minutes: duration_minutes || 30,
                topic,
                description,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Consultation requested", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get my consultations
export const getMyConsultations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;

        let query = supabase
            .from("video_consultations")
            .select("*")
            .or(`requester_id.eq.${userId},contractor_id.eq.${userId}`)
            .order("requested_date", { ascending: true });

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Consultations retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update consultation status (accept/decline/cancel)
export const updateConsultationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status, meeting_link } = req.body;

        if (!['accepted', 'declined', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json(formatResponse(false, "Invalid status", null));
        }

        // Verify ownership
        const { data: consultation } = await supabase
            .from("video_consultations")
            .select("*")
            .eq("id", id)
            .single();

        if (!consultation) {
            return res.status(404).json(formatResponse(false, "Consultation not found", null));
        }

        if (consultation.contractor_id !== userId && consultation.requester_id !== userId) {
            return res.status(403).json(formatResponse(false, "Access denied", null));
        }

        const updates = { status };
        if (meeting_link) updates.meeting_link = meeting_link;

        const { data, error } = await supabase
            .from("video_consultations")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, `Consultation ${status}`, data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
