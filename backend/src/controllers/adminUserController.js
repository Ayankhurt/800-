import { supabase } from "../config/supabaseClient.js";
import { formatResponse } from "../utils/formatResponse.js";
import logger from "../utils/logger.js";
import bcrypt from 'bcryptjs';

// Get All Admin Users
export const getAllAdminUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        let query = supabase
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (role && role !== 'all') {
            query = query.eq('role', role);
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Get admin users error:', error);
            throw error;
        }

        // Remove password_hash from response
        const admins = (data || []).map(admin => {
            const { password_hash, two_factor_secret, ...rest } = admin;
            return rest;
        });

        return res.json(formatResponse(true, 'Admin users retrieved', { admins }));
    } catch (err) {
        logger.error('Get admin users error:', err);
        return res.status(500).json(formatResponse(false, err.message || 'Failed to retrieve admin users', null));
    }
};

// Create Admin User
export const createAdminUser = async (req, res) => {
    try {
        const { email, password, role, first_name, last_name, require_2fa, permissions, ip_whitelist } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json(formatResponse(false, 'Email, password, and role are required', null));
        }

        // Check if email already exists
        const { data: existing } = await supabase
            .from('admin_users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json(formatResponse(false, 'Admin user with this email already exists', null));
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create admin user
        const { data, error } = await supabase
            .from('admin_users')
            .insert({
                email,
                password_hash,
                role,
                first_name: first_name || null,
                last_name: last_name || null,
                two_factor_enabled: false, // Always false by default, users can enable later
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            logger.error('Create admin user error:', error);
            throw error;
        }

        // Remove sensitive data
        const { password_hash: _, two_factor_secret, ...adminData } = data;

        // Log action
        try {
            await supabase.from('audit_logs').insert({
                admin_id: req.user.id,
                action: 'create_admin_user',
                target_resource: 'admin_users',
                target_id: data.id,
                details: { email, role }
            });
        } catch (e) {
            logger.warn('Audit log failed:', e);
        }

        return res.status(201).json(formatResponse(true, 'Admin user created successfully', adminData));
    } catch (err) {
        logger.error('Create admin user error:', err);
        return res.status(500).json(formatResponse(false, err.message || 'Failed to create admin user', null));
    }
};

// Update Admin User
export const updateAdminUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, permissions, require_2fa, ip_whitelist, is_active } = req.body;

        // Prevent self-deactivation
        if (req.user.id === id && is_active === false) {
            return res.status(400).json(formatResponse(false, 'Cannot deactivate your own account', null));
        }

        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (require_2fa !== undefined) updateData.two_factor_enabled = require_2fa;
        if (is_active !== undefined) updateData.is_active = is_active;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('admin_users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Update admin user error:', error);
            throw error;
        }

        if (!data) {
            return res.status(404).json(formatResponse(false, 'Admin user not found', null));
        }

        // Remove sensitive data
        const { password_hash, two_factor_secret, ...adminData } = data;

        // Log action
        try {
            await supabase.from('audit_logs').insert({
                admin_id: req.user.id,
                action: 'update_admin_user',
                target_resource: 'admin_users',
                target_id: id,
                details: updateData
            });
        } catch (e) {
            logger.warn('Audit log failed:', e);
        }

        return res.json(formatResponse(true, 'Admin user updated successfully', adminData));
    } catch (err) {
        logger.error('Update admin user error:', err);
        return res.status(500).json(formatResponse(false, err.message || 'Failed to update admin user', null));
    }
};

// Delete Admin User
export const deleteAdminUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (req.user.id === id) {
            return res.status(400).json(formatResponse(false, 'Cannot delete your own account', null));
        }

        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Delete admin user error:', error);
            throw error;
        }

        // Log action
        try {
            await supabase.from('audit_logs').insert({
                admin_id: req.user.id,
                action: 'delete_admin_user',
                target_resource: 'admin_users',
                target_id: id
            });
        } catch (e) {
            logger.warn('Audit log failed:', e);
        }

        return res.json(formatResponse(true, 'Admin user deleted successfully', null));
    } catch (err) {
        logger.error('Delete admin user error:', err);
        return res.status(500).json(formatResponse(false, err.message || 'Failed to delete admin user', null));
    }
};
