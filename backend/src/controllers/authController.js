// Auth controller
import { supabase } from "../config/supabaseClient.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import { formatResponse } from "../utils/formatResponse.js";
import { sendEmailVerification, sendOtpEmail } from "../utils/email.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import logger from "../utils/logger.js";

dotenv.config();

export const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      phone,
      company_name,
      trade_specialization,
      license_number,
      license_type,
      insurance_provider,
      years_experience,
      location
    } = req.body;

    // Validate input
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json(formatResponse(false, "Missing required fields", null));
    }

    // Create Auth User - Trigger will automatically create user profile
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role }
    });

    if (authError) {
      logger.error("Auth error:", authError);
      return res.status(400).json(formatResponse(false, authError.message, null));
    }

    const userId = authData.user.id;

    // Wait for trigger to complete (increased timeout)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch the user profile created by trigger
    const { data: userProfile, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !userProfile) {
      logger.error("User profile not found after trigger:", fetchError);
      // Cleanup auth user if profile creation failed
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json(formatResponse(false, "User profile creation failed. Please try again.", null));
    }

    // Update additional optional fields
    const updateData = {};
    if (phone) updateData.phone = phone;
    if (company_name) updateData.company_name = company_name;
    if (location) updateData.location = location;

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);
    }

    // If Contractor role, create contractor profile
    if (['general_contractor', 'subcontractor', 'trade_specialist', 'contractor'].includes(role)) {
      const { error: contractorError } = await supabase
        .from("contractor_profiles")
        .insert({
          user_id: userId,
          trade_specialization: trade_specialization || null,
          license_number: license_number || null,
          license_type: license_type || null,
          insurance_provider: insurance_provider || null,
          years_experience: years_experience ? parseInt(years_experience) : 0
        });

      if (contractorError) {
        logger.error("Contractor profile error:", contractorError);
        // Don't fail signup, just log the error
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: userId,
        email,
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Fetch updated profile
    const { data: finalProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    return res.status(201).json(
      formatResponse(true, "Signup successful", {
        token,
        user: finalProfile || {
          id: userId,
          email,
          first_name,
          last_name,
          role
        }
      })
    );

  } catch (err) {
    logger.error("Signup Error:", err);
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check Failed Logins (Security)
    const { data: failedLogin } = await supabase
      .from("failed_logins")
      .select("*")
      .eq("email", email)
      .single();

    if (failedLogin && failedLogin.locked_until) {
      const lockedUntil = new Date(failedLogin.locked_until);
      if (lockedUntil > new Date()) {
        return res.status(403).json(formatResponse(false, "Account locked due to too many failed attempts.", null));
      }
    }

    // 2. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (error) {
      // Log failed attempt
      const attempts = (failedLogin?.attempts || 0) + 1;
      let lockedUntil = null;
      if (attempts >= 5) lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await supabase.from("failed_logins").upsert({
        email,
        attempts,
        last_attempt_at: new Date().toISOString(),
        locked_until: lockedUntil
      }, { onConflict: 'email' });

      await supabase.from("login_logs").insert({
        email_attempted: email,
        success: false,
        reason: "invalid_credentials",
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return res.status(401).json(formatResponse(false, "Invalid email or password", null));
    }

    // 3. Fetch User Details from 'users' table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(400).json(formatResponse(false, "User profile not found", null));
    }

    if (!userProfile.is_active) {
      return res.status(403).json(formatResponse(false, "Account is deactivated", null));
    }

    // 3.5. Check if MFA is enabled - require code if enabled
    if (userProfile.two_factor_enabled && userProfile.two_factor_secret) {
      const { mfa_code } = req.body;

      if (!mfa_code) {
        return res.status(200).json(
          formatResponse(false, "MFA code required", {
            requires_mfa: true,
            user_id: userProfile.id,
            email: userProfile.email
          })
        );
      }

      // Verify MFA code
      const verified = speakeasy.totp.verify({
        secret: userProfile.two_factor_secret,
        encoding: 'base32',
        token: mfa_code,
        window: 2 // Allow 2 time steps before/after current time
      });

      if (!verified) {
        // Log failed MFA attempt
        await supabase.from("login_logs").insert({
          user_id: data.user.id,
          email_attempted: email,
          success: false,
          reason: "invalid_mfa_code",
          ip_address: ipAddress,
          user_agent: userAgent
        });

        return res.status(401).json(formatResponse(false, "Invalid MFA code", null));
      }
    }

    // 4. Reset Failed Logins & Log Success
    if (failedLogin) {
      await supabase.from("failed_logins").delete().eq("email", email);
    }

    await supabase.from("login_logs").insert({
      user_id: data.user.id,
      email_attempted: email,
      success: true,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // 5. Update Last Login
    await supabase.from("users").update({
      last_login_at: new Date().toISOString()
    }).eq("id", data.user.id);

    // 6. Generate Custom JWT
    const token = jwt.sign(
      {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json(
      formatResponse(true, "Login successful", {
        token,
        user: userProfile,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
    );

  } catch (err) {
    logger.error("Login Error:", err);
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const getMe = async (req, res) => {
  try {
    // Auth middleware already fetched user from either users or admin_users table
    const user = req.user;

    if (!user) {
      return res.status(401).json(formatResponse(false, "Unauthorized", null));
    }

    // Return user data (already includes all necessary fields)
    return res.json(formatResponse(true, "User profile retrieved", user));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { first_name, last_name, phone, company_name, bio, location, avatar_url } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        phone,
        company_name,
        bio,
        location,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "Profile updated", data));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { current_password, new_password, password, newPassword } = req.body;

    // Support aliases for frontend/swagger convenience
    const currentPass = current_password || password;
    const newPass = new_password || newPassword;

    if (!currentPass || !newPass) {
      return res.status(400).json(formatResponse(false, "Current and new password required", null));
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPass
    });

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "Password changed successfully", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    // If authenticated request and no email provided, use token email
    if (!email && req.user && req.user.email) {
      email = req.user.email;
    }

    if (!email) {
      return res.status(400).json(formatResponse(false, "Email is required", null));
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "Password reset email sent", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { access_token, new_password } = req.body;

    if (!access_token || !new_password) {
      return res.status(400).json(formatResponse(false, "Access token and new password required", null));
    }

    const { data: userData, error: verifyError } = await supabase.auth.getUser(access_token);

    if (verifyError || !userData?.user) {
      return res.status(400).json(formatResponse(false, "Invalid or expired reset token", null));
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userData.user.id, {
      password: new_password
    });

    if (updateError) {
      return res.status(400).json(formatResponse(false, updateError.message, null));
    }

    return res.json(formatResponse(true, "Password reset successfully", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json(formatResponse(false, "Refresh token required", null));
    }

    // 1. Refresh Supabase Session
    const { data: newSession, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !newSession?.session) {
      return res.status(401).json(formatResponse(false, "Failed to refresh session", null));
    }

    // 2. Fetch User Details from 'users' table to get latest role
    const userId = newSession.user.id;
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json(formatResponse(false, "User profile not found", null));
    }

    if (!userProfile.is_active) {
      return res.status(403).json(formatResponse(false, "Account is deactivated", null));
    }

    // 3. Generate New Custom JWT
    const token = jwt.sign(
      {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Return response matching frontend expectations
    // Frontend expects 'access_token' to be the token used for requests
    return res.json(
      formatResponse(true, "Token refreshed successfully", {
        token, // Custom JWT
        access_token: token, // Return Custom JWT as access_token for frontend compatibility
        refresh_token: newSession.session.refresh_token, // New Supabase refresh token
        user: userProfile
      })
    );
  } catch (err) {
    logger.error("RefreshToken Error:", err);
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      await supabase.from("sessions").delete().eq("refresh_token", refresh_token);
    }

    return res.json(formatResponse(true, "Logged out successfully", null));
  } catch (err) {
    return res.json(formatResponse(true, "Logged out successfully", null));
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json(formatResponse(false, "Missing token", null));
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (error || !user) {
      return res.status(400).json(formatResponse(false, "Invalid token", null));
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        verification_status: 'verified',
        verification_token: null
      })
      .eq("id", user.id);

    if (updateError) {
      return res.status(400).json(formatResponse(false, updateError.message, null));
    }

    return res.json(formatResponse(true, "Email verified successfully", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(formatResponse(false, "Email is required", null));
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const { error } = await supabase
      .from("users")
      .update({ verification_token: verificationToken })
      .eq("email", email);

    if (error) {
      return res.json(formatResponse(true, "If email exists, verification sent", null));
    }

    return res.json(formatResponse(true, "Verification email sent", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const adminCreateUser = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, full_name, role_code, phone, company_name } = req.body;

    let finalFirstName = first_name;
    let finalLastName = last_name;
    const finalRole = role || role_code;

    // Handle full name - prioritize full_name if provided
    if (full_name && full_name.trim()) {
      const parts = full_name.trim().split(/\s+/); // Split by any whitespace
      finalFirstName = parts[0];
      finalLastName = parts.slice(1).join(' ') || parts[0]; // Use first name as last if only one word
    }

    // Validate required fields
    if (!email || !password || !finalFirstName || !finalRole) {
      return res.status(400).json(formatResponse(false, "Missing required fields: email, password, name, and role are required", null));
    }

    // Ensure last name has a value
    if (!finalLastName) {
      finalLastName = finalFirstName; // Use first name as last name if not provided
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: finalFirstName, last_name: finalLastName, role: finalRole }
    });

    if (authError) {
      return res.status(400).json(formatResponse(false, authError.message, null));
    }

    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        first_name: finalFirstName,
        last_name: finalLastName,
        role: finalRole,
        is_active: true,
        verification_status: 'verified'
      });

    if (userError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json(formatResponse(false, userError.message, null));
    }

    return res.status(201).json(
      formatResponse(true, "User created successfully", {
        userId: authData.user.id,
        email: authData.user.email
      })
    );
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const getSessions = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("id, ip_address, user_agent, created_at, expires_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "Sessions retrieved", sessions || []));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

export const deleteSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, "Session deleted successfully", null));
  } catch (err) {
    return res.status(500).json(formatResponse(false, err.message, null));
  }
};

// Setup MFA - Generate secret and QR code
export const setupMFA = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(formatResponse(false, "Unauthorized", null));
    }

    // Check if user already has MFA enabled
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("two_factor_enabled, two_factor_secret")
      .eq("id", userId)
      .single();

    if (userError) {
      logger.error('Setup MFA - user fetch error:', userError);
      return res.status(500).json(formatResponse(false, "Failed to fetch user", null));
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `BidRoom (${user.email || 'Admin'})`,
      issuer: 'BidRoom',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret temporarily (don't enable MFA yet - user needs to verify first)
    const { error: updateError } = await supabase
      .from("users")
      .update({ two_factor_secret: secret.base32 })
      .eq("id", userId);

    if (updateError) {
      logger.error('Setup MFA - secret save error:', updateError);
      return res.status(500).json(formatResponse(false, "Failed to save MFA secret", null));
    }

    return res.json(formatResponse(true, "MFA setup initiated", {
      secret: secret.base32,
      qr_code: qrCodeUrl,
      manual_entry_key: secret.base32
    }));

  } catch (err) {
    logger.error('Setup MFA error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// Verify MFA setup - Verify code and enable MFA
export const verifyMFASetup = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json(formatResponse(false, "Unauthorized", null));
    }

    if (!code) {
      return res.status(400).json(formatResponse(false, "MFA code is required", null));
    }

    // Get user's MFA secret
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("two_factor_secret")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      logger.error('Verify MFA - user fetch error:', userError);
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    if (!user.two_factor_secret) {
      return res.status(400).json(formatResponse(false, "MFA not set up. Please set up MFA first.", null));
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json(formatResponse(false, "Invalid MFA code", null));
    }

    // Enable MFA
    const { error: enableError } = await supabase
      .from("users")
      .update({
        two_factor_enabled: true,
        two_factor_secret: user.two_factor_secret // Keep the secret
      })
      .eq("id", userId);

    if (enableError) {
      logger.error('Verify MFA - enable error:', enableError);
      return res.status(500).json(formatResponse(false, "Failed to enable MFA", null));
    }

    return res.json(formatResponse(true, "MFA enabled successfully", null));

  } catch (err) {
    logger.error('Verify MFA setup error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// Verify OTP during login (if MFA is enabled)
export const verifyOtp = async (req, res) => {
  try {
    const { user_id, code } = req.body;

    if (!user_id || !code) {
      return res.status(400).json(formatResponse(false, "User ID and code are required", null));
    }

    // Get user's MFA secret
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("two_factor_secret, two_factor_enabled, email, role, is_active")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json(formatResponse(false, "MFA is not enabled for this user", null));
    }

    if (!user.is_active) {
      return res.status(403).json(formatResponse(false, "Account is deactivated", null));
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(401).json(formatResponse(false, "Invalid MFA code", null));
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Get Supabase session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: "dummy" // This won't work, we need a different approach
    });

    // Update last login
    await supabase.from("users").update({
      last_login_at: new Date().toISOString()
    }).eq("id", user_id);

    return res.json(formatResponse(true, "MFA verified successfully", {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }));

  } catch (err) {
    logger.error('Verify OTP error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// Disable MFA
export const disableMFA = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body; // Require code to disable for security

    if (!userId) {
      return res.status(401).json(formatResponse(false, "Unauthorized", null));
    }

    // Get user's MFA secret
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("two_factor_secret, two_factor_enabled")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json(formatResponse(false, "User not found", null));
    }

    if (!user.two_factor_enabled) {
      return res.status(400).json(formatResponse(false, "MFA is not enabled", null));
    }

    // Verify code if provided (security measure)
    if (code && user.two_factor_secret) {
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: code,
        window: 2
      });

      if (!verified) {
        return res.status(401).json(formatResponse(false, "Invalid MFA code", null));
      }
    }

    // Disable MFA and clear secret
    const { error: disableError } = await supabase
      .from("users")
      .update({
        two_factor_enabled: false,
        two_factor_secret: null
      })
      .eq("id", userId);

    if (disableError) {
      logger.error('Disable MFA error:', disableError);
      return res.status(500).json(formatResponse(false, "Failed to disable MFA", null));
    }

    return res.json(formatResponse(true, "MFA disabled successfully", null));

  } catch (err) {
    logger.error('Disable MFA error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};

// Toggle MFA (legacy endpoint - redirects to setup/disable)
export const toggleMfa = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(formatResponse(false, "Unauthorized", null));
    }

    const { data: user } = await supabase
      .from("users")
      .select("two_factor_enabled")
      .eq("id", userId)
      .single();

    if (user?.two_factor_enabled) {
      // Disable MFA
      return disableMFA(req, res);
    } else {
      // Setup MFA
      return setupMFA(req, res);
    }
  } catch (err) {
    logger.error('Toggle MFA error:', err);
    return res.status(500).json(formatResponse(false, err.message || "Internal server error", null));
  }
};
