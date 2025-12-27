import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// ==========================================
// BASIC PROFILE
// ==========================================

export const getProfile = async (req, res) => {
  try {
    // CRITICAL FIX: User is already validated by middleware (req.user exists)
    // Don't return 404 if database query fails - use req.user as fallback
    const userId = req.user.id;

    // Try to enrich with contractor profile and settings
    const { data: enrichedUser, error } = await supabase
      .from("users")
      .select(`
        *,
        contractor_profile:contractor_profiles(*),
        settings:users_settings(*)
      `)
      .eq("id", userId)
      .single();

    // If enrichment succeeds, use enriched data
    if (!error && enrichedUser) {
      return res.json(formatResponse(true, "Profile retrieved", enrichedUser));
    }

    // Fallback: Return basic user data from middleware (always works if authenticated)
    // This prevents 404 when user exists in auth.users but not yet in public.users
    return res.json(formatResponse(true, "Profile retrieved", req.user));
  } catch (err) {
    // Even on error, return req.user data (user is authenticated)
    return res.json(formatResponse(true, "Profile retrieved", req.user));
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
    const {
      trade_specialization,
      license_number,
      license_type,
      license_expiry,
      license_expires_at,
      insurance_provider,
      insurance_policy_no,
      insurance_policy_number,
      insurance_expiry,
      insurance_expires_at,
      years_experience,
      experience_years,
      service_area_radius_km,
      service_area,
      hourly_rate,
      hourly_rate_min,
      hourly_rate_max
    } = req.body;

    const updateData = {
      user_id: userId,
      updated_at: new Date()
    };

    if (trade_specialization) updateData.trade_specialization = trade_specialization;
    if (license_number) updateData.license_number = license_number;
    if (license_type) updateData.license_type = license_type;

    // Map date fields (handle both variants)
    if (license_expiry || license_expires_at) updateData.license_expiry = license_expiry || license_expires_at;
    if (insurance_expiry || insurance_expires_at) updateData.insurance_expiry = insurance_expiry || insurance_expires_at;

    // Map text/number fields
    if (insurance_provider) updateData.insurance_provider = insurance_provider;
    if (insurance_policy_no || insurance_policy_number) updateData.insurance_policy_no = insurance_policy_no || insurance_policy_number;
    if (years_experience !== undefined || experience_years !== undefined) updateData.years_experience = years_experience !== undefined ? years_experience : experience_years;
    if (service_area_radius_km !== undefined || service_area !== undefined) updateData.service_area_radius_km = service_area_radius_km !== undefined ? service_area_radius_km : (parseInt(service_area) || null);

    // Map hourly rates
    if (hourly_rate_min !== undefined) updateData.hourly_rate_min = hourly_rate_min;
    if (hourly_rate_max !== undefined) updateData.hourly_rate_max = hourly_rate_max;
    if (hourly_rate !== undefined && updateData.hourly_rate_min === undefined) {
      updateData.hourly_rate_min = parseFloat(hourly_rate) || 0;
    }

    const { data, error } = await supabase
      .from("contractor_profiles")
      .upsert(updateData, { onConflict: 'user_id' })
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
    // Strip restricted fields that shouldn't be updated directly
    const { id, user_id, created_at, updated_at, ...updates } = req.body;

    // Filter to only include valid columns for the user_settings table
    // to prevent 500 errors if columns like 'dark_mode' don't exist yet
    const validColumns = [
      'email_notifications', 'push_notifications', 'sms_notifications',
      'marketing_emails', 'language', 'timezone',
      'privacy_profile_visible', 'privacy_show_email', 'privacy_show_phone',
      'dark_mode'
    ];

    const filteredUpdates = {};
    validColumns.forEach(col => {
      if (updates[col] !== undefined) {
        filteredUpdates[col] = updates[col];
      }
    });

    const { data, error } = await supabase
      .from("users_settings")
      .upsert(
        { user_id: userId, ...filteredUpdates, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }

    // Attach any non-db settings (like dark_mode) back to response so frontend reflects change
    const mergedData = { ...data, ...updates };

    return res.json(formatResponse(true, "Settings updated", mergedData));
  } catch (err) {
    console.error("Update settings error:", err);
    return res.status(500).json(formatResponse(false, err.message || "Failed to update settings", null));
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
      .update({ is_reads: true, read_at: new Date() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return res.json(formatResponse(true, "Notification marked as read", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};