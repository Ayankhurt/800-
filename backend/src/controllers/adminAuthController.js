import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import logger from "../utils/logger.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Admin Login (for admin_users table)
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json(formatResponse(false, 'Email and password are required', null));
        }

        // Get IP and User Agent for logging
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // 1. Find admin user by email
        const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !adminUser) {
            // Log failed attempt
            await supabase.from("login_logs").insert({
                email_attempted: email,
                success: false,
                reason: "invalid_credentials",
                ip_address: ipAddress,
                user_agent: userAgent
            });

            return res.status(401).json(formatResponse(false, 'Invalid email or password', null));
        }

        // 2. Check if account is active
        if (!adminUser.is_active) {
            return res.status(403).json(formatResponse(false, 'Account is deactivated', null));
        }

        // 3. Verify password
        const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);

        if (!isPasswordValid) {
            // Log failed attempt
            await supabase.from("login_logs").insert({
                user_id: adminUser.id,
                email_attempted: email,
                success: false,
                reason: "invalid_password",
                ip_address: ipAddress,
                user_agent: userAgent
            });

            return res.status(401).json(formatResponse(false, 'Invalid email or password', null));
        }

        // 4. Check 2FA if enabled
        if (adminUser.two_factor_enabled) {
            const { mfa_code } = req.body;

            if (!mfa_code) {
                return res.status(200).json(
                    formatResponse(false, "MFA code required", {
                        requires_mfa: true,
                        user_id: adminUser.id,
                        email: adminUser.email
                    })
                );
            }

            // TODO: Verify MFA code with speakeasy
            // For now, skip MFA verification
        }

        // 5. Log successful login
        await supabase.from("login_logs").insert({
            user_id: adminUser.id,
            email_attempted: email,
            success: true,
            ip_address: ipAddress,
            user_agent: userAgent
        });

        // 6. Update last login
        await supabase.from('admin_users').update({
            last_login_at: new Date().toISOString()
        }).eq('id', adminUser.id);

        // 7. Generate JWT token
        const token = jwt.sign(
            {
                id: adminUser.id,
                email: adminUser.email,
                role: adminUser.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // 8. Remove sensitive data from response
        const { password_hash, two_factor_secret, ...adminData } = adminUser;

        // 9. Log audit trail
        try {
            await supabase.from('audit_logs').insert({
                admin_id: adminUser.id,
                action: 'admin_login',
                target_resource: 'admin_users',
                target_id: adminUser.id,
                details: { email, ip_address: ipAddress },
                ip_address: ipAddress
            });
        } catch (e) {
            logger.warn('Audit log failed:', e);
        }

        return res.json(
            formatResponse(true, "Login successful", {
                token,
                user: adminData
            })
        );

    } catch (err) {
        logger.error('Admin Login Error:', err);
        return res.status(500).json(formatResponse(false, err.message || 'Login failed', null));
    }
};
