import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Get Moderation Queue
export const getModerationQueue = async (req, res) => {
    try {
        const { status } = req.query; // pending, approved, removed

        let query = supabase
            .from("content_reports")
            .select(`
                *,
                reporter:users!content_reports_reported_by_fkey(id, first_name, last_name, email),
                moderator:users!content_reports_reviewed_by_fkey(id, first_name, last_name)
            `)
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        } else {
            query = query.eq("status", "pending");
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Moderation queue retrieved", {
            reports: data,
            total: data.length
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Approve Report (Remove Content/Warn User)
export const approveReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { reportId } = req.params;
        const { action, notes } = req.body; // action: 'warn', 'suspend', 'ban', 'remove_content'

        // Get report
        const { data: report, error: reportError } = await supabase
            .from("content_reports")
            .select("*")
            .eq("id", reportId)
            .single();

        if (reportError || !report) {
            return res.status(404).json(formatResponse(false, "Report not found"));
        }

        // Update report status
        const { data: updatedReport, error: updateError } = await supabase
            .from("content_reports")
            .update({
                status: "resolved", // Using resolved instead of approved to match reportController
                reviewed_by: adminId,
                action_taken: action,
                admin_notes: notes,
                reviewed_at: new Date().toISOString()
            })
            .eq("id", reportId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Take action based on type
        switch (action) {
            case 'remove_content':
                // Remove the reported content
                if (report.content_type === 'review') {
                    await supabase
                        .from("reviews")
                        .update({ is_hidden: true })
                        .eq("id", report.content_id);
                } else if (report.content_type === 'message') {
                    await supabase
                        .from("messages")
                        .update({ is_deleted: true })
                        .eq("id", report.content_id);
                } else if (report.content_type === 'project') {
                    await supabase
                        .from("projects")
                        .update({ status: "removed" })
                        .eq("id", report.content_id);
                }
                break;
        }

        return res.json(formatResponse(true, "Report approved and action taken", updatedReport));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Reject Report (No Action Needed)
export const rejectReport = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { reportId } = req.params;
        const { notes } = req.body;

        const { data, error } = await supabase
            .from("content_reports")
            .update({
                status: "dismissed", // Using dismissed to match logic
                reviewed_by: adminId,
                admin_notes: notes,
                reviewed_at: new Date().toISOString()
            })
            .eq("id", reportId)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Report rejected", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get Verification Queue
export const getVerificationQueue = async (req, res) => {
    try {
        const { status } = req.query; // pending, approved, rejected

        let query = supabase
            .from("contractor_verifications")
            .select(`
                *,
                contractor:users!contractor_verifications_contractor_id_fkey(
                    id, first_name, last_name, email, company_name, phone
                ),
                verified_by_user:users!contractor_verifications_verified_by_fkey(
                    id, first_name, last_name
                )
            `)
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("verification_status", status);
        } else {
            query = query.eq("verification_status", "pending");
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Verification queue retrieved", {
            verifications: data,
            total: data.length
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Approve Verification
export const approveVerification = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { verificationId } = req.params;
        const { notes } = req.body;

        // Get verification
        const { data: verification, error: verError } = await supabase
            .from("contractor_verifications")
            .select("*")
            .eq("id", verificationId)
            .single();

        if (verError || !verification) {
            return res.status(404).json(formatResponse(false, "Verification not found"));
        }

        // Update verification
        const { data, error } = await supabase
            .from("contractor_verifications")
            .update({
                verification_status: "approved",
                verified_by: adminId,
                verified_at: new Date().toISOString(),
                admin_notes: notes
            })
            .eq("id", verificationId)
            .select()
            .single();

        if (error) throw error;

        // Update user verification status
        await supabase
            .from("users")
            .update({
                is_verified: true,
                verified_at: new Date().toISOString()
            })
            .eq("id", verification.contractor_id);

        // Send notification
        await supabase
            .from("notifications")
            .insert({
                user_id: verification.contractor_id,
                type: "verification_approved",
                title: "Verification Approved",
                message: "Congratulations! Your contractor verification has been approved.",
                created_at: new Date().toISOString()
            });

        return res.json(formatResponse(true, "Verification approved", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Reject Verification
export const rejectVerification = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { verificationId } = req.params;
        const { reason, notes } = req.body;

        // Get verification
        const { data: verification, error: verError } = await supabase
            .from("contractor_verifications")
            .select("*")
            .eq("id", verificationId)
            .single();

        if (verError || !verification) {
            return res.status(404).json(formatResponse(false, "Verification not found"));
        }

        // Update verification
        const { data, error } = await supabase
            .from("contractor_verifications")
            .update({
                verification_status: "rejected",
                verified_by: adminId,
                verified_at: new Date().toISOString(),
                rejection_reason: reason,
                admin_notes: notes
            })
            .eq("id", verificationId)
            .select()
            .single();

        if (error) throw error;

        // Send notification
        await supabase
            .from("notifications")
            .insert({
                user_id: verification.contractor_id,
                type: "verification_rejected",
                title: "Verification Rejected",
                message: `Your verification was not approved. Reason: ${reason}`,
                created_at: new Date().toISOString()
            });

        return res.json(formatResponse(true, "Verification rejected", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Create Admin User
export const createAdminUser = async (req, res) => {
    try {
        const { email, password, first_name, last_name, role } = req.body; // role: 'admin', 'super_admin', 'moderator'

        // Verify requester is super_admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json(formatResponse(false, "Only super admins can create admin users"));
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                role
            }
        });

        if (authError) throw authError;

        // Update user role in database
        const { data, error } = await supabase
            .from("users")
            .update({
                role: role,
                first_name,
                last_name
            })
            .eq("id", authData.user.id)
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Admin user created", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update Admin User
export const updateAdminUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, permissions } = req.body;

        // Verify requester is super_admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json(formatResponse(false, "Only super admins can update admin users"));
        }

        const { data, error } = await supabase
            .from("users")
            .update({
                role,
                admin_permissions: permissions
            })
            .eq("id", userId)
            .select()
            .single();

        if (error) throw error;

        return res.json(formatResponse(true, "Admin user updated", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
