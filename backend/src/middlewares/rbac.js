import { formatResponse } from "../utils/formatResponse.js";

// Permission definitions for each role
const ROLE_PERMISSIONS = {
    admin: [
        // User Management
        'users.view', 'users.edit', 'users.delete', 'users.suspend',
        // Jobs
        'jobs.view', 'jobs.edit', 'jobs.delete', 'jobs.feature',
        // Bids
        'bids.view', 'bids.edit', 'bids.delete',
        // Projects
        'projects.view', 'projects.edit', 'projects.delete',
        // Payments
        'payments.view', 'payments.refund', 'payments.release',
        // Reviews
        'reviews.view', 'reviews.delete', 'reviews.moderate',
        // Disputes
        'disputes.view', 'disputes.resolve',
        // Verification
        'verification.approve', 'verification.reject',
        // Analytics
        'analytics.view',
        // System
        'system.settings', 'system.logs'
    ],

    moderator: [
        'users.view', 'users.suspend',
        'jobs.view', 'jobs.moderate',
        'reviews.view', 'reviews.moderate',
        'content.moderate'
    ],

    general_contractor: [
        'jobs.view', 'jobs.apply',
        'bids.create', 'bids.view', 'bids.edit',
        'projects.view', 'projects.update',
        'messages.send', 'messages.view',
        'profile.edit'
    ],

    subcontractor: [
        'jobs.view', 'jobs.apply',
        'bids.create', 'bids.view',
        'projects.view',
        'messages.send', 'messages.view',
        'profile.edit'
    ],

    trade_specialist: [
        'jobs.view', 'jobs.apply',
        'bids.create', 'bids.view',
        'projects.view',
        'messages.send', 'messages.view',
        'profile.edit'
    ],

    project_manager: [
        'jobs.create', 'jobs.view', 'jobs.edit', 'jobs.delete',
        'bids.view', 'bids.accept', 'bids.reject',
        'projects.view', 'projects.manage',
        'contractors.view', 'contractors.invite',
        'messages.send', 'messages.view',
        'payments.deposit', 'payments.release',
        'profile.edit'
    ],

    viewer: [
        'jobs.view',
        'contractors.view',
        'projects.view'
    ]
};

/**
 * Check if user has required permission
 */
export const hasPermission = (userRole, permission) => {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
};

/**
 * Middleware to check if user has required permission
 * Usage: requirePermission('users.edit')
 */
export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(formatResponse(false, "Authentication required", null));
        }

        const userRole = req.user.role;

        if (!hasPermission(userRole, permission)) {
            return res.status(403).json(formatResponse(false, `Permission denied. Required: ${permission}`, null));
        }

        next();
    };
};

/**
 * Middleware to check if user has ANY of the required permissions
 * Usage: requireAnyPermission(['users.edit', 'users.view'])
 */
export const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(formatResponse(false, "Authentication required", null));
        }

        const userRole = req.user.role;
        const hasAny = permissions.some(permission => hasPermission(userRole, permission));

        if (!hasAny) {
            return res.status(403).json(formatResponse(false, `Permission denied. Required one of: ${permissions.join(', ')}`, null));
        }

        next();
    };
};

/**
 * Middleware to check if user has ALL of the required permissions
 * Usage: requireAllPermissions(['users.edit', 'users.delete'])
 */
export const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(formatResponse(false, "Authentication required", null));
        }

        const userRole = req.user.role;
        const hasAll = permissions.every(permission => hasPermission(userRole, permission));

        if (!hasAll) {
            return res.status(403).json(formatResponse(false, `Permission denied. Required all of: ${permissions.join(', ')}`, null));
        }

        next();
    };
};

/**
 * Check if user is resource owner or has permission
 */
export const requireOwnershipOrPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(formatResponse(false, "Authentication required", null));
        }

        // Store for use in controller
        req.checkOwnership = true;
        req.requiredPermission = permission;

        next();
    };
};

export default {
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    requireOwnershipOrPermission,
    hasPermission,
    ROLE_PERMISSIONS
};
