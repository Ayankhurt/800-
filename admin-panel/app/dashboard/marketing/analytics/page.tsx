'use client';

import AnalyticsIntegration from '@/src/components/admin/AnalyticsIntegration';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <AnalyticsIntegration />
    </ProtectedRoute>
  );
}


