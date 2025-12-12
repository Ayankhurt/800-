import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Submit verification request
export const submitVerificationRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { verification_type, documents } = req.body;

        if (!verification_type || !documents || documents.length === 0) {
            return res.status(400).json(formatResponse(false, "Verification type and documents required", null));
        }

        const { data, error } = await supabase
            .from("verification_requests")
            .insert({
                user_id: userId,
                type: verification_type, // Map input to DB column 'type'
                documents,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Verification request submitted", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get verification requests (admin)
export const getVerificationRequests = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        let query = supabase
            .from("verification_requests")
            .select(`
        *,
        user:users (id, first_name, last_name, email, company_name)
      `, { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (status) query = query.eq("status", status);
        if (type) query = query.eq("verification_type", type);

        const { data, count, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Verification requests retrieved", {
            requests: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get verification request details
export const getVerificationRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("verification_requests")
            .select(`
        *,
        user:users (*)
      `)
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json(formatResponse(false, "Verification request not found", null));
        }

        return res.json(formatResponse(true, "Verification request details retrieved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Approve verification (admin)
export const approveVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const { data: request, error: fetchError } = await supabase
            .from("verification_requests")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !request) {
            return res.status(404).json(formatResponse(false, "Verification request not found", null));
        }

        // Update request status
        const { data, error } = await supabase
            .from("verification_requests")
            .update({
                status: 'approved',
                reviewed_by: req.user.id,
                reviewed_at: new Date(),
                admin_notes: notes
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Update user verification status
        const updateData = {};
        if (request.verification_type === 'identity') {
            updateData.identity_verified = true;
        } else if (request.verification_type === 'license') {
            updateData.license_verified = true;
        } else if (request.verification_type === 'insurance') {
            updateData.insurance_verified = true;
        } else if (request.verification_type === 'background_check') {
            updateData.background_check_verified = true;
        }

        await supabase
            .from("users")
            .update(updateData)
            .eq("id", request.user_id);

        return res.json(formatResponse(true, "Verification approved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Reject verification (admin)
export const rejectVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json(formatResponse(false, "Rejection reason required", null));
        }

        const { data, error } = await supabase
            .from("verification_requests")
            .update({
                status: 'rejected',
                reviewed_by: req.user.id,
                reviewed_at: new Date(),
                rejection_reason: reason
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Verification rejected", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get user's verification status
export const getMyVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("verification_requests")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Verification status retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
