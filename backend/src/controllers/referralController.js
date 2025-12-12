import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";

// Get my referral code
export const getMyReferralCode = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user has referral code
        let { data: referral } = await supabase
            .from("referrals")
            .select("*")
            .eq("user_id", userId)
            .single();

        // Create if doesn't exist
        if (!referral) {
            const code = `REF${userId.substring(0, 8).toUpperCase()}`;

            const { data: newReferral, error } = await supabase
                .from("referrals")
                .insert({
                    user_id: userId,
                    referral_code: code,
                    total_referrals: 0,
                    total_earnings: 0
                })
                .select()
                .single();

            if (error) throw error;
            referral = newReferral;
        }

        return res.json(formatResponse(true, "Referral code retrieved", referral));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Apply referral code during signup
export const applyReferralCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const { referral_code } = req.body;

        if (!referral_code) {
            return res.status(400).json(formatResponse(false, "Referral code required", null));
        }

        // Find referrer
        const { data: referrer } = await supabase
            .from("referrals")
            .select("*")
            .eq("referral_code", referral_code)
            .single();

        if (!referrer) {
            return res.status(404).json(formatResponse(false, "Invalid referral code", null));
        }

        // Check if user already used a referral
        const { data: existing } = await supabase
            .from("referral_uses")
            .select("id")
            .eq("referred_user_id", userId)
            .single();

        if (existing) {
            return res.status(400).json(formatResponse(false, "You have already used a referral code", null));
        }

        // Record referral use
        const { data, error } = await supabase
            .from("referral_uses")
            .insert({
                referrer_id: referrer.user_id,
                referred_user_id: userId,
                referral_code,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Update referrer stats
        await supabase
            .from("referrals")
            .update({
                total_referrals: referrer.total_referrals + 1
            })
            .eq("user_id", referrer.user_id);

        return res.status(201).json(formatResponse(true, "Referral code applied", data));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get my referrals
export const getMyReferrals = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from("referral_uses")
            .select(`
        *,
        referred_user:users!referral_uses_referred_user_id_fkey (
          id, first_name, last_name, created_at
        )
      `)
            .eq("referrer_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json(formatResponse(true, "Referrals retrieved", data || []));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};

// Get referral stats
export const getReferralStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: referral } = await supabase
            .from("referrals")
            .select("*")
            .eq("user_id", userId)
            .single();

        const { data: uses } = await supabase
            .from("referral_uses")
            .select("status")
            .eq("referrer_id", userId);

        const stats = {
            referral_code: referral?.referral_code || null,
            total_referrals: referral?.total_referrals || 0,
            total_earnings: referral?.total_earnings || 0,
            active_referrals: uses?.filter(u => u.status === 'active').length || 0,
            pending_referrals: uses?.filter(u => u.status === 'pending').length || 0
        };

        return res.json(formatResponse(true, "Referral stats retrieved", stats));
    } catch (err) {
        return res.status(500).json(formatResponse(false, err.message, null));
    }
};
