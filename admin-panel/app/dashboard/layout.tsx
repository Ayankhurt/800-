'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/src/components/layout/AdminLayout';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuth } from '@/src/contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  // Get current page from pathname
  const getCurrentPage = (): string => {
    if (!pathname) return 'dashboard';
    const path = pathname.replace('/dashboard', '').replace('/', '') || 'dashboard';
    return path === '' ? 'dashboard' : path;
  };

  // Convert user to AuthUser format for AdminLayout
  // Map backend role_code to frontend role format
  const roleMap: Record<string, string> = {
    'SUPER': 'super_admin',
    'ADMIN': 'admin',
    'FIN': 'finance_manager',
    'MOD': 'moderator',
    'SUPPORT': 'support_agent',
    'PM': 'admin', // Default to admin for app roles
    'GC': 'admin',
    'SUB': 'admin',
    'TS': 'admin',
    'VIEWER': 'admin',
  };

  const currentUser = user
    ? {
        email: user.email || '',
        name: user.full_name || user.email || 'User',
        role: (roleMap[user.role_code] || 'admin') as any,
      }
    : null;

  return (
    <ProtectedRoute requireAdmin={true}>
      {currentUser && (
        <AdminLayout currentUser={currentUser} onLogout={logout}>
          {children}
        </AdminLayout>
      )}
    </ProtectedRoute>
  );
}

