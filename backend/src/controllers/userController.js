import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// ==========================================
// BASIC PROFILE
// ==========================================

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from("users")
      .select(`
        *,
        contractor_profile:contractor_profiles(*),
        settings:user_settings(*)
      `)
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    return res.json(formatResponse(true, "Profile retrieved", user));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, company_name, bio, avatar_url, location } = req.body;

    const updateData = {
      first_name, last_name, phone, company_name, bio, avatar_url, location,
      updated_at: new Date().toISOString()
    };

    // Remove undefined keys
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return res.json(formatResponse(true, "Profile updated successfully", data));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// ==========================================
// CONTRACTOR PROFILE
// ==========================================

export const updateContractorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Upsert contractor profile
    const { data, error } = await supabase
      .from("contractor_profiles")
      .upsert({ user_id: userId, ...updates, updated_at: new Date() }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return res.json(formatResponse(true, "Contractor profile updated", data));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// ==========================================
// PORTFOLIO
// ==========================================

export const addPortfolioItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, images, project_type, completion_date } = req.body;

    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({
        contractor_id: userId,
        title,
        description,
        images: images || [],
        project_type,
        completion_date
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(formatResponse(true, "Portfolio item added", data));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const deletePortfolioItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", id)
      .eq("contractor_id", userId);

    if (error) throw error;

    return res.json(formatResponse(true, "Portfolio item deleted", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// ==========================================
// CERTIFICATIONS
// ==========================================

export const addCertification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, issuing_organization, issue_date, expiry_date, credential_id, credential_url } = req.body;

    const { data, error } = await supabase
      .from("certifications")
      .insert({
        contractor_id: userId,
        name,
        issuing_organization,
        issue_date,
        expiry_date,
        credential_id,
        credential_url,
        is_verified: false
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(formatResponse(true, "Certification added", data));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// ==========================================
// SETTINGS
// ==========================================

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const { data, error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, ...updates, updated_at: new Date() }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return res.json(formatResponse(true, "Settings updated", data));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// ==========================================
// NOTIFICATIONS
// ==========================================

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.json(formatResponse(true, "Notifications retrieved", { notifications: data, total: count }));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return res.json(formatResponse(true, "Notification marked as read", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};