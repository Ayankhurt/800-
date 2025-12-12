'use client';

import MarketingDashboard from '@/src/components/admin/MarketingDashboard';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function MarketingPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <MarketingDashboard />
    </ProtectedRoute>
  );
}


