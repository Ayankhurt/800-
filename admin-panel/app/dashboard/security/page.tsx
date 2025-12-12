'use client';

import SecurityDashboard from '@/src/components/admin/SecurityDashboard';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function SecurityPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <SecurityDashboard />
    </ProtectedRoute>
  );
}


