'use client';

import { Dashboard } from '@/src/components/dashboard/Dashboard';
import { useAuth } from '@/src/contexts/AuthContext';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // Convert role_code to role format expected by Dashboard
  const roleMap: Record<string, string> = {
    SUPER: 'super_admin',
    ADMIN: 'admin',
    FIN: 'finance_manager',
    MOD: 'moderator',
    SUPPORT: 'support_agent',
  };

  const role = roleMap[user.role_code] || 'admin';

  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN', 'FIN', 'SUPPORT', 'MOD']}>
      <Dashboard role={role as any} />
    </ProtectedRoute>
  );
}
