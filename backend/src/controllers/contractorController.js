import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Get contractor profile with all details
export const getContractorProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch user data first
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, first_name, last_name, email, phone, avatar_url, company_name, location, bio, trust_score, created_at, role")
            .eq("id", id)
            .single();

        if (userError || !user) {
            return res.status(404).json(formatResponse(false, "User not found", null));
        }

        // Fetch contractor profile (optional)
        const { data: profile, error } = await supabase
            .from("contractor_profiles")
            .select("*")
            .eq("user_id", id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Merge data
        const responseData = {
            ...user, // Base fields from user
            ...(profile || {}), // Fields from profile if exists
            user: user // Keep nested user object for compatibility
        };

        return res.json(formatResponse(true, "Contractor profile retrieved", responseData));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Update contractor profile
export const updateContractorProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            trade_specialization,
            license_number,
            license_type,
            license_expiry,
            insurance_provider,
            insurance_policy_number,
            insurance_expiry,
            years_experience,
            service_area,
            hourly_rate_min,
            hourly_rate_max
        } = req.body;

        const updateData = { user_id: userId };
        if (trade_specialization) updateData.trade_specialization = trade_specialization;
        if (license_number) updateData.license_number = license_number;
        if (license_type) updateData.license_type = license_type;
        if (license_expiry) updateData.license_expiry = license_expiry;
        if (insurance_provider) updateData.insurance_provider = insurance_provider;
        if (insurance_policy_number) updateData.insurance_policy_number = insurance_policy_number;
        if (insurance_expiry) updateData.insurance_expiry = insurance_expiry;
        if (years_experience !== undefined) updateData.years_experience = years_experience;
        if (service_area) updateData.service_area = service_area;
        if (hourly_rate_min !== undefined) updateData.hourly_rate_min = hourly_rate_min;
        if (hourly_rate_max !== undefined) updateData.hourly_rate_max = hourly_rate_max;

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

// Portfolio Management
export const addPortfolioItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, images, project_type, completion_date } = req.body;

        if (!title || !images || images.length === 0) {
            return res.status(400).json(formatResponse(false, "Title and at least one image required", null));
        }

        const { data, error } = await supabase
            .from("portfolio_items")
            .insert({
                contractor_id: userId,
                title,
                description,
                images,
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

export const getPortfolioItems = async (req, res) => {
    try {
        const { contractor_id } = req.params;

        const { data, error } = await supabase
            .from("portfolio_items")
            .select("*")
            .eq("contractor_id", contractor_id)
            .order("completion_date", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Portfolio items retrieved", data || []));
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

// Certifications Management
export const addCertification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, issuing_organization, issue_date, expiry_date, credential_id, credential_url } = req.body;

        if (!name || !issuing_organization) {
            return res.status(400).json(formatResponse(false, "Name and issuing organization required", null));
        }

        const { data, error } = await supabase
            .from("certifications")
            .insert({
                contractor_id: userId,
                name,
                issuing_organization,
                issue_date,
                expiry_date,
                credential_id,
                credential_url
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json(formatResponse(true, "Certification added", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const getCertifications = async (req, res) => {
    try {
        const { contractor_id } = req.params;

        const { data, error } = await supabase
            .from("certifications")
            .select("*")
            .eq("contractor_id", contractor_id)
            .order("issue_date", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Certifications retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

export const deleteCertification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from("certifications")
            .delete()
            .eq("id", id)
            .eq("contractor_id", userId);

        if (error) throw error;

        return res.json(formatResponse(true, "Certification deleted", null));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Search contractors
export const searchContractors = async (req, res) => {
    try {
        const {
            search,
            trade,
            location,
            min_rating,
            verified_only,
            page = 1,
            limit = 20
        } = req.query;

        const offset = (page - 1) * limit;

        let query = supabase
            .from("contractor_profiles")
            .select("*", { count: 'exact' })
            .range(offset, offset + limit - 1);

        if (trade) {
            query = query.eq("trade_specialization", trade);
        }

        if (verified_only === 'true') {
            query = query.eq("is_verified", true);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return res.json(formatResponse(true, "Contractors retrieved", {
            contractors: data,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        }));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
