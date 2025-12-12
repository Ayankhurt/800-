'use client';

import SEOManagement from '@/src/components/admin/SEOManagement';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function SEOPage() {
  return (
    <ProtectedRoute allowedRoles={['SUPER', 'ADMIN']}>
      <SEOManagement />
    </ProtectedRoute>
  );
}


