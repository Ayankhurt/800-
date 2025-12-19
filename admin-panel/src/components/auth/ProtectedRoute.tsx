'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAdmin?: boolean;
}

// Define admin roles for web admin panel
// Note: ADMIN_APP is for mobile app, not web admin panel
const ALLOWED_ADMIN_ROLES = ['ADMIN', 'FIN', 'SUPPORT', 'MOD']; // SUPER is handled separately

// Role hierarchy and permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER: ['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD'], // Full access to all
  ADMIN: ['ADMIN', 'FIN', 'SUPPORT', 'MOD'], // Admin panel access (cannot assign SUPER or ADMIN)
  FIN: ['FIN'], // Only Finance
  SUPPORT: ['SUPPORT'], // Only Support/Tickets + Disputes messages
  MOD: ['MOD'], // Moderator access
  // ADMIN_APP is for mobile app only, not included here
};

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading, isSuper } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // CRITICAL: Don't do anything if still loading
    if (loading) return;

    // Check if user is authenticated
    if (!user) {
      router.push('/');
      return;
    }

    const userRole = (user.role_code || '').toUpperCase();

    // SUPER ADMIN has GOD-MODE - bypass ALL checks
    if (userRole === 'SUPER' || isSuper) {
      return;
    }

    // If role_code is not loaded yet, wait
    if (!user.role_code || userRole === '') {
      return;
    }

    // Block ADMIN_APP (mobile app only)
    if (userRole === 'ADMIN_APP') {
      router.push('/403');
      return;
    }

    // Check if admin access is required
    if (requireAdmin) {
      // Role must be in allowed admin roles
      if (!ALLOWED_ADMIN_ROLES.includes(userRole)) {
        router.push('/403');
        return;
      }
      return;
    }

    // Check if user has required role
    if (allowedRoles && allowedRoles.length > 0) {
      // Check if user is an admin role
      if (!ALLOWED_ADMIN_ROLES.includes(userRole) && userRole !== 'SUPER') {
        router.push('/dashboard');
        return;
      }

      // Check if user's role is directly in allowedRoles
      const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());
      if (normalizedAllowedRoles.includes(userRole)) {
        return;
      }

      // Check role hierarchy
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];
      const hasAccess = normalizedAllowedRoles.some(role => {
        return userPermissions.includes(role);
      });

      if (!hasAccess) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, isSuper, router, allowedRoles, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if we should allow rendering
  const shouldRender = () => {
    if (loading) return false;
    if (!user) return false;

    const userRole = (user.role_code || '').toUpperCase();

    // SUPER ADMIN bypasses everything
    if (isSuper || userRole === 'SUPER') return true;

    // WAIT for role_code to be loaded
    if (!user.role_code && userRole === '') return false;

    // ADMIN_APP blocked
    if (userRole === 'ADMIN_APP') return false;

    // If admin is required
    if (requireAdmin) {
      if (!ALLOWED_ADMIN_ROLES.includes(userRole) && userRole !== 'SUPER') return false;
      return true;
    }

    // specific allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      if (!ALLOWED_ADMIN_ROLES.includes(userRole) && userRole !== 'SUPER') return false;

      const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());
      if (normalizedAllowedRoles.includes(userRole)) return true;

      const userPermissions = ROLE_PERMISSIONS[userRole] || [];
      const hasAccess = normalizedAllowedRoles.some(role => userPermissions.includes(role));
      if (!hasAccess) return false;
    }

    // Default allow
    return true;
  };

  const showContent = shouldRender();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !showContent) {
    return null;
  }

  return <>{children}</>;
}



